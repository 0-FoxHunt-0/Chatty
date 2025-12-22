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
  
  // Check if the directory exists
  if (!fs.existsSync(frontendPath)) {
    console.error(`ERROR: Frontend build directory not found at: ${frontendPath}`);
    console.error(`Please ensure the frontend has been built before starting the server.`);
  } else {
    console.log(`✓ Frontend build directory found at: ${frontendPath}`);
    console.log(`Contents:`, fs.readdirSync(frontendPath));
  }

  app.use(express.static(frontendPath));

  // Catch all handler: send back React's index.html file for client-side routing
  // This must be last to catch all non-API routes
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }
    // For all other routes, serve the React app
    const indexPath = path.join(frontendPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(`ERROR: index.html not found at: ${indexPath}`);
      return res.status(404).send("Frontend build not found. Please ensure the frontend has been built.");
    }
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(`Error sending index.html:`, err);
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
