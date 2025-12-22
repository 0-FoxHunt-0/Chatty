import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import TypingIndicator from "./TypingIndicator";
import { useAuthStore } from "../store/useAuthStore";
import avatarImage from "../assets/avatar.jpg";
import { formatLocalTime } from "../lib/utils";

const ChatContainer = () => {
  const { selectedUser, messages, areMessagesLoading, getMessages, isTyping } =
    useChatStore();
  const { user } = useAuthStore();

  // Helper function to get a valid profile picture URL
  const getProfilePicture = (profilePicture?: string | null): string => {
    return profilePicture && profilePicture.trim() !== ""
      ? profilePicture
      : avatarImage;
  };

  // Fetch messages when selected user changes
  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getMessages]);

  // Show skeleton messages while loading
  if (areMessagesLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === user?._id ? "chat-end" : "chat-start"
            }`}
          >
            {/* Avatar - aligned with chat header */}
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === user?._id
                      ? getProfilePicture(user?.profilePicture)
                      : getProfilePicture(selectedUser?.profilePicture)
                  }
                  alt={
                    message.senderId === user?._id
                      ? user?.fullName
                      : selectedUser?.fullName
                  }
                />
              </div>
            </div>
            {/* Chat Header - sender name and timestamp */}
            <div className="chat-header mb-1 flex items-center gap-2">
              <div className="text-sm text-base-content/70">
                {message.senderId === user?._id
                  ? user?.fullName
                  : selectedUser?.fullName}
              </div>
              <time className="text-xs opacity-50">
                {formatLocalTime(message.createdAt)}
              </time>
            </div>
            {/* Chat Bubble - contains text and/or image */}
            <div className="chat-bubble bg-base-300 p-2">
              {/* Text message */}
              {message.text && (
                <div className={message.image ? "mb-2" : ""}>
                  {message.text}
                </div>
              )}
              {/* Image message */}
              {message.image && (
                <div>
                  <img
                    src={message.image}
                    alt="Message Image"
                    className="max-w-sm rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
