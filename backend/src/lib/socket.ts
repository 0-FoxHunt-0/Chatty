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
  });

  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Get token from handshake auth or cookies
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.cookie?.split("jwt=")[1]?.split(";")[0];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };

      const user: IUser | null = await User.findById(decoded.id).select(
        "-password"
      );
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = (
        user as IUser & { _id: mongoose.Types.ObjectId }
      )._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Store online users: userId -> socketId
  const onlineUsers = new Map<string, string>();

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    console.log(`User connected: ${userId}`);

    // Send current list of online users to the newly connected client
    const currentOnlineUsers = Array.from(onlineUsers.keys());
    socket.emit("online-users-list", currentOnlineUsers);

    // Add user to online users
    onlineUsers.set(userId, socket.id);

    // Emit online status to all clients (including the newly connected one)
    io.emit("user-online", userId);

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

          // Send to receiver if online
          const receiverSocketId = onlineUsers.get(data.receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("new-message", populatedMessage);
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
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-typing", { userId });
      }
    });

    socket.on("typing-stop", (data: { receiverId: string }) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user-stopped-typing", { userId });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      io.emit("user-offline", userId);
    });
  });

  return io;
};
