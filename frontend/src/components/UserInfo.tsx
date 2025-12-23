import { X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import avatarImage from "../assets/avatar.jpg";
import { formatMemberSince } from "../lib/utils";

const UserInfo = () => {
  const { selectedUser, isUserInfoVisible, setUserInfoVisible } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedUser || !isUserInfoVisible) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);
  const profilePicture =
    selectedUser.profilePicture && selectedUser.profilePicture.trim() !== ""
      ? selectedUser.profilePicture
      : avatarImage;

  return (
    <div className="h-full bg-base-100 border-l border-base-300 flex flex-col transition-all duration-300 ease-in-out">
      {/* Header with X button */}
      <div className="border-b border-base-300 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">User Info</h2>
        <button
          onClick={() => setUserInfoVisible(false)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Close user info"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Section */}
        <div className="flex items-start gap-4">
          {/* Profile Picture with Online Status */}
          <div className="avatar relative">
            <div className="size-16 rounded-full">
              <img src={profilePicture} alt={selectedUser.fullName} />
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 size-4 bg-success rounded-full border-2 border-base-100"></div>
            )}
          </div>
          {/* Full Name */}
          <div className="flex-1 pt-2">
            <h3 className="text-xl font-semibold">{selectedUser.fullName}</h3>
          </div>
        </div>

        {/* Bio Section */}
        <div>
          <h4 className="text-sm font-medium text-base-content/70 mb-2">Bio</h4>
          <div className="min-h-[90px]">
            {selectedUser.bio && selectedUser.bio.trim() !== "" ? (
              <p className="text-base-content/90">{selectedUser.bio}</p>
            ) : (
              <p className="text-base-content/50 italic">
                Nothing to see here yet...
              </p>
            )}
          </div>
        </div>

        {/* Member Since Section */}
        {selectedUser.createdAt && (
          <div>
            <h4 className="text-sm font-medium text-base-content/70 mb-2">
              Member Since
            </h4>
            <p className="text-base-content/90">
              {formatMemberSince(selectedUser.createdAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
