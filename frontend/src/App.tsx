import Navbar from "./components/Navbar";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import PageNotFound from "./pages/PageNotFound";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const MainLayout = () => (
  <>
    <Navbar />
    <div className="flex-1 overflow-hidden">
      <Outlet />
    </div>
  </>
);

const App = () => {
  const { initializeAuth, user, isLoading, isInitialized } = useAuthStore();
  const { initializeTheme } = useThemeStore();
  const { initializeSocket, cleanupSocket } = useChatStore();

  useEffect(() => {
    // Initialize theme first
    initializeTheme();

    // Initialize auth - checks cache first, only calls API if cache exists
    if (!isInitialized) {
      initializeAuth();
    }
  }, [initializeAuth, isInitialized, initializeTheme]);

  // Initialize Socket.io when user is logged in
  useEffect(() => {
    if (user) {
      // Initialize socket when user is logged in
      initializeSocket();
    } else {
      // Cleanup socket when user logs out
      cleanupSocket();
    }

    // Cleanup on unmount
    return () => {
      cleanupSocket();
    };
  }, [user, initializeSocket, cleanupSocket]);

  // Show loading until initialization is complete
  if (!isInitialized || (isLoading && !user))
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Routes>
        {/* Routes with Navbar */}
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={user ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/" />}
          />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
        </Route>

        {/* 404 without Navbar */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
