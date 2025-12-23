import { Server as HTTPServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User, { IUser } from "../models/user.model";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: IUser;
}

export const initializeSocket = (httpServer: HTTPServer) => {
  const isProduction = process.env.NODE_ENV === "production";

  const io = new SocketServer(httpServer, {
    cors: {
      origin: isProduction
        ? process.env.FRONTEND_URL || true // Allow same origin in production, or specific URL if set
        : "http://localhost:5173", // Development origin
      credentials: true,
    },
    // Transport configuration for better compatibility with reverse proxies (Render, etc.)
    // Allow upgrade from polling to websocket
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    // Increase ping timeout and interval for production stability
    pingTimeout: 60000,
    pingInterval: 25000,
    // Connection state recovery for brief disconnections
    connectionStateRecovery: {
      // the backup duration of the sessions and the packets
      maxDisconnectionDuration: 2 * 60 * 1000,
      // whether to skip middlewares upon successful recovery
      skipMiddlewares: true,
    },
  });

  // Engine.IO-level connection errors (handshake / transport issues)
  io.engine.on("connection_error", (err) => {
    console.error("Engine.IO connection_error:", {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Get token from handshake auth or cookies
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.cookie?.split("jwt=")[1]?.split(";")[0];

      if (!token) {
        console.error("Socket auth failed: no token provided", {
          origin: socket.handshake.headers.origin,
          hasCookieHeader: Boolean(socket.handshake.headers.cookie),
          cookieHeaderLength: socket.handshake.headers.cookie?.length || 0,
          transport: socket.conn.transport.name,
        });
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };

      const user: IUser | null = await User.findById(decoded.id).select(
        "-password"
      );
      if (!user) {
        console.error("Socket auth failed: user not found", {
          userIdFromToken: decoded.id,
        });
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = (
        user as IUser & { _id: mongoose.Types.ObjectId }
      )._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket auth failed: invalid token", {
        origin: socket.handshake.headers.origin,
        hasCookieHeader: Boolean(socket.handshake.headers.cookie),
        cookieHeaderLength: socket.handshake.headers.cookie?.length || 0,
        transport: socket.conn.transport.name,
      });
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Store online users: userId -> Set of socketIds (user may have multiple connections)
  const onlineUsers = new Map<string, Set<string>>();

  // Helper to check if user is online (has at least one connection)
  const isUserOnline = (userId: string): boolean => {
    const sockets = onlineUsers.get(userId);
    return sockets !== undefined && sockets.size > 0;
  };

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const wasOnline = isUserOnline(userId);

    console.log(`User connected: ${userId} (socket: ${socket.id}, transport: ${socket.conn.transport.name})`);

    // Track this socket for the user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Send current list of online users to the newly connected client
    const currentOnlineUsers = Array.from(onlineUsers.keys()).filter(isUserOnline);
    socket.emit("online-users-list", currentOnlineUsers);

    // Only emit user-online if they weren't already online (handles reconnects/multiple tabs)
    if (!wasOnline) {
      io.emit("user-online", userId);
    }

    // Join user's personal room for direct messaging
    socket.join(userId);

    // Handle sending messages
    socket.on(
      "send-message",
      async (data: { receiverId: string; text?: string; image?: string }) => {
        try {
          // Import Message model and cloudinary
          const Message = (await import("../models/message.model")).default;
          const cloudinary = (await import("../lib/cloudinary")).default;

          // Handle image upload to Cloudinary if image is provided
          let imageUrl = null;
          if (data.image) {
            const uploadResponse = await cloudinary.uploader.upload(data.image);
            imageUrl = uploadResponse.secure_url;
          }

          // Create message in database
          const message = await Message.create({
            senderId: userId,
            receiverId: data.receiverId,
            text: data.text,
            image: imageUrl,
          });

          // Populate sender info
          const populatedMessage = await Message.findById(message._id)
            .populate("senderId", "fullName profilePicture")
            .populate("receiverId", "fullName profilePicture");

          // Send to receiver if online (send to all their connected sockets)
          const receiverSockets = onlineUsers.get(data.receiverId);
          if (receiverSockets && receiverSockets.size > 0) {
            receiverSockets.forEach((socketId) => {
              io.to(socketId).emit("new-message", populatedMessage);
            });
          }

          // Also send back to sender for confirmation
          socket.emit("message-sent", populatedMessage);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("message-error", { error: "Failed to send message" });
        }
      }
    );

    // Handle typing indicators
    socket.on("typing-start", (data: { receiverId: string }) => {
      const receiverSockets = onlineUsers.get(data.receiverId);
      if (receiverSockets && receiverSockets.size > 0) {
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit("user-typing", { userId });
        });
      }
    });

    socket.on("typing-stop", (data: { receiverId: string }) => {
      const receiverSockets = onlineUsers.get(data.receiverId);
      if (receiverSockets && receiverSockets.size > 0) {
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit("user-stopped-typing", { userId });
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${userId} (socket: ${socket.id}, reason: ${reason})`);
      
      // Remove this specific socket from the user's set
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // Only emit user-offline if they have no remaining connections
        // This handles transport upgrades, multiple tabs, and brief reconnects
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("user-offline", userId);
        }
      }
    });
  });

  return io;
};
