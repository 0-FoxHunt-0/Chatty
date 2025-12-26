import { useState } from "react";
import { Palette, UserRound, LogOut, Search } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import AppearanceSettings from "./AppearanceSettings";
import AccountSettings from "./AccountSettings";

type MenuItem = "appearance" | "account";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
  const [activeMenu, setActiveMenu] = useState<MenuItem>("appearance");
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    onClose();
    navigate("/login");
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open" onClick={onClose}>
      <div
        className="modal-box max-w-6xl w-full h-[90vh] p-0 flex rounded-xl bg-base-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <form method="dialog" className="hidden">
          <button>close</button>
        </form>

        {/* Close button - only visible on small screens */}
        <form method="dialog" className="lg:hidden">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
          >
            ✕
          </button>
        </form>

        {/* Vertical Menu */}
        <div className="w-56 border-r border-base-300 flex flex-col">
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center border border-base-300 rounded-lg overflow-hidden">
              <div className="w-[20%] flex items-center justify-center bg-base-200 border-r border-base-300 h-10">
                <Search className="w-4 h-4 text-base-content/50" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="input input-bordered w-[80%] border-0 rounded-none focus:outline-none h-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="menu w-[95%] p-2">
              <li className="w-full">
                <button
                  onClick={() => setActiveMenu("appearance")}
                  className={`w-full mx-auto rounded-lg transition-colors ${
                    activeMenu === "appearance"
                      ? "bg-base-300 text-base-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <Palette className="w-5 h-5" />
                  Appearance
                </button>
              </li>
              <li className="w-full">
                <button
                  onClick={() => setActiveMenu("account")}
                  className={`w-full mx-auto rounded-lg transition-colors ${
                    activeMenu === "account"
                      ? "bg-base-300 text-base-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <UserRound className="w-5 h-5" />
                  Your Account
                </button>
              </li>
            </ul>
          </div>
          <div className="p-2 border-t border-base-300 flex justify-center">
            <button
              onClick={handleSignOut}
              className="btn w-[85%] hover:btn-error rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeMenu === "appearance" && <AppearanceSettings />}
          {activeMenu === "account" && <AccountSettings />}
        </div>
      </div>
    </dialog>
  );
};

export default UserSettingsModal;
