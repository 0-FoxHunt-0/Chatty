import { useChatStore } from "../store/useChatStore";
import { useEffect, useState, useMemo } from "react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Settings } from "lucide-react";
import avatarImage from "../assets/avatar.jpg";
import { useAuthStore } from "../store/useAuthStore";
import OnlineStatusIndicator from "./reusables/OnlineStatusIndicator";
import UserSettingsModal from "./UserSettingsModal";

const Sidebar = () => {
  const { users, areUsersLoading, getUsers, selectedUser, setSelectedUser } =
    useChatStore();

  const { onlineUsers, user } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (showOnlineOnly) {
      return users.filter((user) => onlineUsers.includes(user._id));
    }
    return users;
  }, [users, showOnlineOnly, onlineUsers]);

  if (areUsersLoading) return <SidebarSkeleton />;

  return (
    // Sidebar Container - Main wrapper with responsive width (20 on mobile, 72 on large screens)
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Header Section - Contains title and filter controls */}
      <div className="border-b border-base-300 w-full p-5">
        {/* Title Section - "Contacts" heading with icon */}
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* Filter Toggle Section - Checkbox to show only online users */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          {/* Online Count Badge - Shows number of online users (excluding current user) */}
          <span className="text-xs text-zinc-500">
            ({Math.max(0, onlineUsers.filter((id) => id !== user?._id).length)}{" "}
            online)
          </span>
        </div>
      </div>

      {/* Scrollable User List Container */}
      <div className="overflow-y-auto w-full py-3 flex-1">
        {/* Empty State Message - Shown when no users match the filter */}
        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
        {filteredUsers.map((user) => (
          // Individual User Button - Clickable user item with hover and selected states
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors cursor-pointer
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            {/* Avatar Container - Profile picture with online status indicator */}
            <div className="avatar relative mx-auto lg:mx-0">
              {/* User Profile Picture */}
              <div className="size-12 rounded-full">
                <img
                  src={user.profilePicture || avatarImage}
                  alt={user.fullName}
                  className="object-cover rounded-full"
                />
              </div>
              {/* Online Status Indicator */}
              <OnlineStatusIndicator
                isOnline={onlineUsers.includes(user._id)}
              />
            </div>

            {/* User Info Section - Name and status text (only visible on larger screens) */}
            <div className="hidden lg:block text-left min-w-0">
              {/* User Full Name */}
              <div className="font-medium truncate">{user.fullName}</div>
              {/* Online/Offline Status Text */}
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* User Dock at Bottom */}
      {user && (
        <div className="w-full border-t border-base-300 p-3 bg-base-100 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Left Side - User Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar opens settings modal (tooltip should exist at all widths) */}
              <div
                className="tooltip tooltip-right lg:tooltip-top"
                data-tip="User settings"
              >
                <div
                  className="avatar relative shrink-0 cursor-pointer"
                  onClick={() => setIsSettingsModalOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setIsSettingsModalOpen(true);
                    }
                  }}
                  aria-label="User settings"
                >
                  <div className="size-10 rounded-full">
                    <img
                      src={user.profilePicture || avatarImage}
                      alt={user.fullName}
                      className="object-cover rounded-full"
                    />
                  </div>
                  <OnlineStatusIndicator
                    isOnline={onlineUsers.includes(user._id)}
                    showOffline={true}
                  />
                </div>
              </div>
              {/* User name and status - hidden on small screens */}
              <div className="hidden lg:block min-w-0 flex-1">
                <div className="font-medium truncate text-sm">
                  {user.fullName}
                </div>
                <div className="text-xs text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </div>

            {/* Settings icon should NOT be always hidden (show on large screens) */}
            <div
              className="tooltip tooltip-top hidden lg:block"
              data-tip="User settings"
            >
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="btn btn-ghost btn-sm btn-circle shrink-0 group"
                aria-label="User settings"
              >
                <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-360" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
