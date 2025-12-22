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

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// CORS configuration
const isProduction = process.env.NODE_ENV === "production";
const frontendUrl = process.env.FRONTEND_URL;

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

// Serve static files from frontend build in production
if (isProduction) {
  const frontendPath = path.join(__dirname, "../../frontend/dist");

  app.use(express.static(frontendPath));

  // Catch all handler: send back React's index.html file for client-side routing
  // This must be last to catch all non-API routes
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }
    // For all other routes, serve the React app
    res.sendFile(path.join(frontendPath, "index.html"), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
