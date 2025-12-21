import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import type { IUser } from "../../models/user.model";
import { showToast } from "../lib/toast";
import type { IMessage } from "../../models/message.model";

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
}

export const useChatStore = create<IChatStore>((set) => ({
  messages: [],
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
    set(() => ({ areMessagesLoading: true }));
    try {
      const response = await axiosInstance.post(
        `/messages/send/${selectedUser?._id}`,
        message
      );
      set((state) => ({
        messages: [...state.messages, response.data.content],
        areMessagesLoading: false,
      }));
      return response.data.content;
    } catch (error) {
      set((state) => ({ messages: state.messages, areMessagesLoading: false }));
      console.error("Failed to send message", error);
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
    })),
  areUsersLoading: false,
}));
