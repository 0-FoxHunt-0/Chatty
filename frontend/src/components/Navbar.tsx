import { useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  // Get current page name
  const getCurrentPageName = () => {
    if (location.pathname === "/") return "Chatty";
    return (
      location.pathname.slice(1).charAt(0).toUpperCase() +
      location.pathname.slice(2)
    );
  };

  const currentPageName = getCurrentPageName();
  const shouldShowBrand = location.pathname === "/";

  return (
    <header className="border-b border-base-300 sticky w-full top-0 z-40 backdrop-blur-lg bg-base-100">
      <div className="w-full px-[5%] h-12">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2 text-base-content/80">
            {shouldShowBrand && (
              <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
            )}
            <span className="text-sm font-medium">{currentPageName}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
