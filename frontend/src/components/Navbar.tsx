import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOutIcon, MessageSquare } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  return (
    <header
      className="border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-4">
              {user ? (
                <>
                  <li>
                    <Link to="/settings" className="hover:underline">Settings</Link>
                  </li>
                  <li>
                    <Link to="/profile" className="hover:underline">Profile</Link>
                  </li>
                  <li>
                    <button onClick={() => logout()} className="hover:text-error transition-colors">
                      <LogOutIcon className="w-5 h-5" />
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:underline">Login</Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:underline">Register</Link>
                  </li>
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
