import { useChatStore } from "../store/useChatStore";
import avatarImage from "../assets/avatar.jpg";

const TypingIndicator = () => {
  const { selectedUser } = useChatStore();

  // Helper function to get a valid profile picture URL
  const getProfilePicture = (profilePicture?: string | null): string => {
    return profilePicture && profilePicture.trim() !== ""
      ? profilePicture
      : avatarImage;
  };

  return (
    <div className="chat chat-start">
      <div className="chat-image avatar">
        <div className="size-10 rounded-full border">
          <img
            src={getProfilePicture(selectedUser?.profilePicture)}
            alt={selectedUser?.fullName || "User"}
          />
        </div>
      </div>
      <div className="chat-header mb-1">
        <div className="text-sm text-base-content/70">
          {selectedUser?.fullName || "User"} is typing...
        </div>
      </div>
      <div className="chat-bubble bg-base-300 p-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-base-content/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-base-content/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 bg-base-content/60 rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

