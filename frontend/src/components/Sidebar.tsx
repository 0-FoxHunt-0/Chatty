import { useChatStore } from "../store/useChatStore";
import { useEffect, useState, useMemo } from "react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import avatarImage from "../assets/avatar.jpg";
import { useAuthStore } from "../store/useAuthStore";

const Sidebar = () => {
  const { users, areUsersLoading, getUsers, selectedUser, setSelectedUser } =
    useChatStore();

  const { onlineUsers, user } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

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
            ({Math.max(0, onlineUsers.filter((id) => id !== user?._id).length)} online)
          </span>
        </div>
      </div>

      {/* Scrollable User List Container */}
      <div className="overflow-y-auto w-full py-3">
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
            <div className="relative mx-auto lg:mx-0">
              {/* User Profile Picture */}
              <img
                src={user.profilePicture || avatarImage}
                alt={user.fullName}
                className="size-12 object-cover rounded-full"
              />
              {/* Online Status Indicator - Green dot shown when user is online */}
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
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
    </aside>
  );
};

export default Sidebar;
