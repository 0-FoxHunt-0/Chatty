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
}

export const useChatStore = create<IChatStore>((set, get) => ({
  messages: [],
  socket: null,

  initializeSocket: (token?: string) => {
    const socket = getSocket(token);

    // Listen for new messages
    socket.on("new-message", (message: IMessage) => {
      const { selectedUser } = get();
      // Handle both string IDs and populated object IDs
      const messageSenderId =
        typeof message.senderId === "object"
          ? (message.senderId as { _id: string })._id
          : message.senderId;

      // Only add message if it's from the currently selected user
      if (selectedUser && messageSenderId === selectedUser._id) {
        set((state) => {
          // Check if message already exists to avoid duplicates
          const exists = state.messages.some((m) => m._id === message._id);
          if (!exists) {
            return { messages: [...state.messages, message] };
          }
          return state;
        });
      }
    });

    // Listen for message sent confirmation
    socket.on("message-sent", (message: IMessage) => {
      set((state) => {
        // Check if message already exists to avoid duplicates
        const exists = state.messages.some((m) => m._id === message._id);
        if (!exists) {
          return { messages: [...state.messages, message] };
        }
        return state;
      });
    });

    // Listen for message errors
    socket.on("message-error", (data: { error: string }) => {
      showToast.error(data.error || "Failed to send message");
    });

    // Listen for initial online users list (sent when connecting)
    socket.on("online-users-list", (userIds: string[]) => {
      // Set the complete list of online users
      const authStore = useAuthStore.getState();
      // Clear and set all online users at once
      authStore.setOnlineUsers(userIds);
    });

    // Listen for online/offline status
    socket.on("user-online", (userId: string) => {
      // Update online users in auth store
      useAuthStore.getState().addOnlineUser(userId);
    });

    socket.on("user-offline", (userId: string) => {
      // Remove from online users in auth store
      useAuthStore.getState().removeOnlineUser(userId);
    });

    // Listen for typing indicators
    socket.on("user-typing", (data: { userId: string }) => {
      const { selectedUser } = get();
      // Only show typing indicator if it's from the currently selected user
      if (selectedUser && data.userId === selectedUser._id) {
        set({ isTyping: true });
      }
    });

    socket.on("user-stopped-typing", (data: { userId: string }) => {
      const { selectedUser } = get();
      // Only hide typing indicator if it's from the currently selected user
      if (selectedUser && data.userId === selectedUser._id) {
        set({ isTyping: false });
      }
    });

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

    if (!socket || !socket.connected) {
      showToast.error("Not connected to server");
      throw new Error("Socket not connected");
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
        senderId: get().selectedUser?._id || "",
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
    })),
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
