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
import session from "express-session";
import passport from "./lib/passport";

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

// Passport uses session for OAuth state/callback validation.
// This session is not used for app auth (JWT cookie is), only for the OAuth handshake.
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || process.env.JWT_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Strict can break OAuth redirects; Lax is the typical choice
      sameSite: "lax",
      maxAge: 1000 * 60 * 10, // 10 minutes
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve static files from frontend build (PRODUCTION ONLY)
// In development, use the Vite dev server on port 5173 instead
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

  // Check if the directory exists and serve static files
  if (fs.existsSync(frontendPath)) {
    console.log(`✓ Frontend build directory found at: ${frontendPath}`);
    console.log(`Contents:`, fs.readdirSync(frontendPath));

    // Explicitly handle favicon and other icon requests BEFORE the catch-all route
    // This ensures they are served with correct Content-Type headers
    const faviconPath = path.join(frontendPath, "favicon.ico");
    if (fs.existsSync(faviconPath)) {
      app.get("/favicon.ico", (req, res) => {
        res.setHeader("Content-Type", "image/x-icon");
        res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
        res.sendFile(path.resolve(faviconPath));
      });
    }

    // Handle PNG favicons
    app.get("/favicon-:size.png", (req, res, next) => {
      const pngPath = path.join(frontendPath, `favicon-${req.params.size}.png`);
      if (fs.existsSync(pngPath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.sendFile(path.resolve(pngPath));
      } else {
        next();
      }
    });

    // Handle apple-touch-icon
    const appleTouchPath = path.join(frontendPath, "apple-touch-icon.png");
    if (fs.existsSync(appleTouchPath)) {
      app.get("/apple-touch-icon.png", (req, res) => {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.sendFile(path.resolve(appleTouchPath));
      });
    }

    // Handle web manifest
    const manifestPath = path.join(frontendPath, "site.webmanifest");
    if (fs.existsSync(manifestPath)) {
      app.get("/site.webmanifest", (req, res) => {
        res.setHeader("Content-Type", "application/manifest+json");
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.sendFile(path.resolve(manifestPath));
      });
    }

    // Handle android-chrome icons (used by webmanifest)
    app.get("/android-chrome-:size.png", (req, res, next) => {
      const iconPath = path.join(
        frontendPath,
        `android-chrome-${req.params.size}.png`
      );
      if (fs.existsSync(iconPath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.sendFile(path.resolve(iconPath));
      } else {
        next();
      }
    });

    // Serve static files (CSS, JS, images, etc.)
    // Set maxAge for caching static assets
    app.use(
      express.static(frontendPath, {
        index: false, // index: false prevents serving index.html for root
        maxAge: "1y", // Cache static assets for 1 year
        etag: true, // Enable ETag for better caching
      })
    );

    // Catch all handler: send back React's index.html file for client-side routing
    // This must be last to catch all non-API routes
    // Express 5 requires named wildcard parameter syntax
    // Note: express.static middleware above will handle static files first
    app.get("/{*splat}", (req, res, next) => {
      // Skip API routes and health check - let them be handled by route handlers above
      // Static files are handled by express.static middleware, which calls next() if file not found
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
    console.error(`✗ Frontend build directory not found at: ${frontendPath}`);
    console.error(
      `✗ In production mode but no frontend build found. Please build the frontend first.`
    );
  }
} else {
  console.log(`ℹ Development mode: Static file serving disabled.`);
  console.log(
    `ℹ Use the Vite dev server (npm run dev in frontend/) at http://localhost:5173`
  );
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
