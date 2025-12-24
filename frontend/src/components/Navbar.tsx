import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  LogInIcon,
  LogOutIcon,
  MessageSquare,
  UserRoundPlusIcon,
} from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    // Only enable scroll animation if user is not logged in and on Login/Register pages
    const shouldEnableScrollAnimation =
      !user &&
      (location.pathname === "/login" || location.pathname === "/register");

    // If scroll animation should not be active, always show navbar
    if (!shouldEnableScrollAnimation) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        // Always show navbar at the top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide navbar
        setIsVisible(false);
      } else {
        // Scrolling up - show navbar
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  return (
    <header
      className={`border-b border-base-300 sticky w-full top-0 z-40 backdrop-blur-lg bg-base-100 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="w-full px-[5%] h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-4">
              {user ? (
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 hover:text-error transition-colors cursor-pointer"
                  >
                    <LogOutIcon className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </li>
              ) : (
                <>
                  {location.pathname !== "/login" && (
                    <li>
                      <Link
                        to="/login"
                        className="flex items-center gap-4 hover:opacity-80 transition-colors"
                      >
                        <LogInIcon className="w-5 h-5" /> Login
                      </Link>
                    </li>
                  )}
                  {location.pathname !== "/register" && (
                    <li>
                      <Link
                        to="/register"
                        className="flex items-center gap-4 hover:opacity-80 transition-colors"
                      >
                        <UserRoundPlusIcon className="w-5 h-5" /> Register
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
