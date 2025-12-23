import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import type { IUser } from "../../models/user.model";
import { showToast } from "../lib/toast";
import type { IMessage } from "../../models/message.model";
import { getSocket, disconnectSocket } from "../lib/socket";
import { Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";

interface SendMessagePayload {
  text: string;
  image?: string;
}

interface IChatStore {
  messages: IMessage[];
  addMessage: (message: IMessage) => void;
  getMessages: (otherUserId: string) => Promise<IMessage[]>;
  sendMessage: (
    message: SendMessagePayload,
    selectedUser: IUser
  ) => Promise<IMessage>;
  areMessagesLoading: boolean;
  users: IUser[] | null;
  getUsers: () => Promise<IUser[]>;
  selectedUser: IUser | null;
  setSelectedUser: (user: IUser | null) => void;
  areUsersLoading: boolean;
  socket: Socket | null;
  initializeSocket: (token?: string) => void;
  cleanupSocket: () => void;
  isTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;
  emitTypingStart: (receiverId: string) => void;
  emitTypingStop: (receiverId: string) => void;
  isUserInfoVisible: boolean;
  setUserInfoVisible: (visible: boolean) => void;
}

export const useChatStore = create<IChatStore>((set, get) => ({
  messages: [],
  socket: null,

  initializeSocket: (token?: string) => {
    const socket = getSocket(token);

    // Ensure auth token (if provided) is used for the next (re)connect.
    if (token) {
      socket.auth = { token };
    }

    // Diagnostics (safe to leave; logs only connection state, not secrets)
    socket.off("connect");
    socket.off("disconnect");
    socket.io.off("reconnect_attempt");
    socket.io.off("reconnect_failed");
    socket.io.off("reconnect");

    socket.on("connect", () => {
      console.log("[socket] connected", {
        id: socket.id,
        transport: socket.io.engine.transport.name,
      });
    });

    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected", {
        reason,
        wasConnected: socket.connected,
      });
    });

    socket.io.on("reconnect_attempt", (attempt: number) => {
      console.log("[socket] reconnect_attempt", { attempt });
    });

    socket.io.on("reconnect_failed", () => {
      console.warn("[socket] reconnect_failed");
    });

    socket.io.on("reconnect", (attempt: number) => {
      console.log("[socket] reconnected after", {
        attempt,
        attempts: "attempts",
      });
      // Server will automatically send online-users-list on reconnect
    });

    // Avoid duplicate listeners by clearing only the events we own.
    socket.off("new-message");
    socket.off("message-sent");
    socket.off("message-error");
    socket.off("online-users-list");
    socket.off("user-online");
    socket.off("user-offline");
    socket.off("user-typing");
    socket.off("user-stopped-typing");
    socket.off("connect_error");

    // Attach listeners BEFORE connecting so we can't miss early server emits (like online-users-list).
    socket.on("new-message", (message: IMessage) => {
      const { selectedUser } = get();
      const messageSenderId =
        typeof message.senderId === "object"
          ? (message.senderId as { _id: string })._id
          : message.senderId;

      if (selectedUser && messageSenderId === selectedUser._id) {
        set((state) => {
          const exists = state.messages.some((m) => m._id === message._id);
          if (!exists) {
            const normalizedMessage: IMessage = {
              ...message,
              senderId: messageSenderId,
              receiverId:
                typeof message.receiverId === "object"
                  ? (message.receiverId as { _id: string })._id
                  : message.receiverId,
            };
            return { messages: [...state.messages, normalizedMessage] };
          }
          return state;
        });
      }
    });

    socket.on("message-sent", (message: IMessage) => {
      set((state) => {
        const exists = state.messages.some((m) => m._id === message._id);
        if (!exists) {
          const normalizedMessage: IMessage = {
            ...message,
            senderId:
              typeof message.senderId === "object"
                ? (message.senderId as { _id: string })._id
                : message.senderId,
            receiverId:
              typeof message.receiverId === "object"
                ? (message.receiverId as { _id: string })._id
                : message.receiverId,
          };
          return { messages: [...state.messages, normalizedMessage] };
        }
        return state;
      });
    });

    socket.on("message-error", (data: { error: string }) => {
      showToast.error(data.error || "Failed to send message");
    });

    socket.on("online-users-list", (userIds: string[]) => {
      console.log("[socket] online-users-list", { count: userIds.length });
      useAuthStore.getState().setOnlineUsers(userIds);
    });

    socket.on("user-online", (userId: string) => {
      console.log("[socket] user-online", { userId });
      useAuthStore.getState().addOnlineUser(userId);
    });

    socket.on("user-offline", (userId: string) => {
      console.log("[socket] user-offline", { userId });
      useAuthStore.getState().removeOnlineUser(userId);
    });

    socket.on("user-typing", (data: { userId: string }) => {
      const { selectedUser } = get();
      if (selectedUser && data.userId === selectedUser._id) {
        set({ isTyping: true });
      }
    });

    socket.on("user-stopped-typing", (data: { userId: string }) => {
      const { selectedUser } = get();
      if (selectedUser && data.userId === selectedUser._id) {
        set({ isTyping: false });
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      if (error.message?.includes("Authentication")) {
        showToast.error("Authentication failed. Please log in again.");
      }
    });

    // Now connect (socket is created with autoConnect:false).
    if (!socket.connected) {
      socket.connect();
    }

    set({ socket });
  },

  cleanupSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      disconnectSocket();
      set({ socket: null });
    }
  },

  addMessage: (message: IMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),

  getMessages: async (otherUserId: string) => {
    set(() => ({ areMessagesLoading: true }));
    try {
      const messages = await axiosInstance.get(`/messages/${otherUserId}`);
      set(() => ({
        messages: messages.data.messages,
        areMessagesLoading: false,
      }));
      return messages.data.messages;
    } catch (error) {
      set(() => ({ messages: [], areMessagesLoading: false }));
      showToast.error("Failed to fetch messages");
      throw error;
    }
  },

  sendMessage: async (message: SendMessagePayload, selectedUser: IUser) => {
    const { socket } = get();
    const currentUser = useAuthStore.getState().user;

    if (!socket || !socket.connected) {
      showToast.error("Not connected to server");
      throw new Error("Socket not connected");
    }

    if (!currentUser) {
      showToast.error("User not authenticated");
      throw new Error("User not authenticated");
    }

    try {
      // Emit message via Socket.io
      socket.emit("send-message", {
        receiverId: selectedUser._id,
        text: message.text,
        image: message.image,
      });

      // Return a temporary message object (will be replaced by server response)
      const tempMessage: IMessage = {
        _id: `temp-${Date.now()}`,
        senderId: currentUser._id,
        receiverId: selectedUser._id,
        text: message.text,
        image: message.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return tempMessage;
    } catch (error) {
      console.error("Failed to send message", error);
      showToast.error("Failed to send message");
      throw error;
    }
  },
  areMessagesLoading: false,
  users: null,
  getUsers: async () => {
    set(() => ({ areUsersLoading: true }));
    try {
      const users = await axiosInstance.get("/messages/users");
      set(() => ({ users: users.data.users, areUsersLoading: false }));
      return users.data.users;
    } catch (error) {
      set(() => ({ users: null, areUsersLoading: false }));
      showToast.error("Failed to fetch users");
      throw error;
    }
  },
  selectedUser: null,
  setSelectedUser: (user: IUser | null) =>
    set((state) => ({
      selectedUser:
        state.selectedUser && user && state.selectedUser._id === user._id
          ? null
          : user,
      // Reset typing state when user changes
      isTyping: false,
      // Set UserInfo visibility: true when user is selected, false when deselected
      isUserInfoVisible: user !== null,
    })),
  isUserInfoVisible: false,
  setUserInfoVisible: (visible: boolean) => set({ isUserInfoVisible: visible }),
  areUsersLoading: false,
  isTyping: false,
  setIsTyping: (isTyping: boolean) => set({ isTyping }),
  emitTypingStart: (receiverId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit("typing-start", { receiverId });
    }
  },
  emitTypingStop: (receiverId: string) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit("typing-stop", { receiverId });
    }
  },
}));
