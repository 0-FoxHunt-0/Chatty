import express from "express";
import { createServer } from "http";
import authRoutes from "./routes/auth.route";
import dotenv from "dotenv";
import connectDB from "./lib/db";
import cookieParser from "cookie-parser";
import messageRoutes from "./routes/message.route";
import cors from "cors";
import { initializeSocket } from "./lib/socket";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Health check route - register FIRST before any middleware
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize Socket.io
initializeSocket(httpServer);

// CORS configuration
const isProduction = process.env.NODE_ENV === "production";
const frontendUrl = process.env.FRONTEND_URL;

// Log environment info for debugging
console.log(`NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
console.log(`isProduction: ${isProduction}`);

// If FRONTEND_URL is set, use it (for separate frontend/backend deployment)
// Otherwise, in production with same origin, CORS not needed
if (frontendUrl || !isProduction) {
  app.use(
    cors({
      origin: frontendUrl || "http://localhost:5173",
      credentials: true,
    })
  );
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve static files from frontend build
// Try to find and serve frontend dist folder (works in production or when frontend is built)
// Try multiple path resolution strategies
// Strategy 1: From __dirname (when running from dist folder)
// __dirname will be backend/dist in compiled code
let frontendPath = path.resolve(__dirname, "../../frontend/dist");

// Strategy 2: From process.cwd() (working directory, should be backend folder on Render)
if (!fs.existsSync(frontendPath)) {
  frontendPath = path.resolve(process.cwd(), "../frontend/dist");
}

// Strategy 3: Absolute from project root (if cwd is already project root)
if (!fs.existsSync(frontendPath)) {
  frontendPath = path.resolve(process.cwd(), "frontend/dist");
}

console.log(`Current working directory: ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);
console.log(`Attempting to serve static files from: ${frontendPath}`);

// Check if the directory exists and serve static files
if (fs.existsSync(frontendPath)) {
  console.log(`✓ Frontend build directory found at: ${frontendPath}`);
  console.log(`Contents:`, fs.readdirSync(frontendPath));

  // Serve static files (CSS, JS, images, etc.)
  app.use(express.static(frontendPath, { index: false })); // index: false prevents serving index.html for root

  // Catch all handler: send back React's index.html file for client-side routing
  // This must be last to catch all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes and health check - let them be handled by route handlers above
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }

    // For all other routes, serve the React app's index.html
    const indexPath = path.join(frontendPath, "index.html");
    console.log(`Serving index.html for route: ${req.path}`);

    if (!fs.existsSync(indexPath)) {
      console.error(`ERROR: index.html not found at: ${indexPath}`);
      return res
        .status(404)
        .send(
          "Frontend build not found. Please ensure the frontend has been built."
        );
    }

    res.sendFile(path.resolve(indexPath), (err) => {
      if (err) {
        console.error(`Error sending index.html for ${req.path}:`, err);
        res.status(500).send("Error serving frontend");
      }
    });
  });
} else {
  console.warn(`⚠ Frontend build directory not found at: ${frontendPath}`);
  console.warn(
    `⚠ Static file serving disabled. This is normal in development mode.`
  );

  // Add a catch-all for non-API routes when frontend isn't built
  app.get("*", (req, res, next) => {
    // Skip API routes and health check
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }
    res
      .status(404)
      .send(
        "Frontend not built. Please ensure the frontend has been built before deployment."
      );
  });
}

const PORT = process.env.PORT || 5001;

// Add error handler for unhandled routes
app.use((req, res) => {
  console.log(`Unhandled route: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Route not found", path: req.path });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  connectDB();
});

// Handle server errors
httpServer.on("error", (err: NodeJS.ErrnoException) => {
  console.error("Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
