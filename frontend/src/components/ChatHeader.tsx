import { useChatStore } from "../store/useChatStore";
import avatarImage from "../assets/avatar.jpg";
import { useAuthStore } from "../store/useAuthStore";
import { X } from "lucide-react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="border-b border-base-300 p-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="avatar">
          <div className="size-10 rounded-full relative">
            <img
              src={selectedUser?.profilePicture || avatarImage}
              alt={selectedUser?.fullName}
            />
          </div>
        </div>
        {/* User info */}
        <div>
          <h3 className="font-medium">{selectedUser?.fullName}</h3>
          <p className="text-sm text-base-content/70">
            {onlineUsers.includes(selectedUser?._id || "")
              ? "Online"
              : "Offline"}
          </p>
        </div>
      </div>
      {/* Close button */}
      <button onClick={() => setSelectedUser(null)}>
        <X />
      </button>
    </div>
  );
};

export default ChatHeader;
