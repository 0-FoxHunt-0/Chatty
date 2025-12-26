# Chatty 💬

A modern, real-time chat application built with React, TypeScript, Node.js, and Socket.io. Chatty enables users to send instant messages, share images, and see real-time online status updates.

## ✨ Features

- 🔐 **User Authentication** - Secure login and registration with JWT tokens
- 💬 **Real-time Messaging** - Instant message delivery using Socket.io
- 📸 **Image Sharing** - Upload and share images in conversations
- 🟢 **Online Status** - See who's online in real-time
- ⌨️ **Typing Indicators** - Know when someone is typing
- 🎨 **Theme Support** - Light and dark mode
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔒 **Protected Routes** - Secure authentication-based routing
- 👤 **User Profiles** - Manage your profile and view others

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **Tailwind CSS** - Styling
- **DaisyUI** - Component library
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **Socket.io** - WebSocket server
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Image storage
- **Cookie Parser** - Cookie handling
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB database (local or cloud)
- Cloudinary account (for image uploads)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Chatty
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# Google requires an absolute redirect URI
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Run the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The backend will run on `http://localhost:5001` and the frontend on `http://localhost:5173`.

#### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Backend (serves frontend):**
```bash
cd backend
npm run build
npm start
```

## 📁 Project Structure

```
Chatty/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   └── lib/             # Utilities (db, socket, cloudinary)
│   └── dist/                # Compiled JavaScript
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand stores
│   │   ├── lib/             # Utilities (axios, socket, utils)
│   │   └── assets/          # Static assets
│   └── public/              # Public assets
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/check-auth` - Get current user (requires auth)
- `GET /api/auth/oauth/status` - OAuth provider availability (e.g. Google enabled/disabled)
- `GET /api/auth/google` - Start Google OAuth (only when configured)
- `GET /api/auth/google/callback` - Google OAuth callback

### Messages
- `GET /api/messages/:userId` - Get messages with a user
- `POST /api/messages` - Send a message (via Socket.io)

### Health Check
- `GET /health` - Server health status

## 🔐 Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5001) |
| `NODE_ENV` | Environment (development/production) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `SESSION_SECRET` | Secret key for OAuth session (used only for the Google OAuth handshake) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Frontend URL for CORS (optional) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |
| `GOOGLE_CALLBACK_URL` | Full Google OAuth callback URL (optional, recommended) |

## 📝 Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run build:frontend` - Build frontend before backend build

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Key Features Implementation

### Real-time Messaging
- Uses Socket.io for bidirectional communication
- Messages are stored in MongoDB
- Real-time delivery to online users
- Typing indicators for better UX

### Authentication
- JWT tokens stored in HTTP-only cookies
- Protected routes on both frontend and backend
- Automatic token refresh
- Secure password hashing with bcrypt

### Image Sharing
- Images uploaded to Cloudinary
- Base64 encoding for client-side preview
- Optimized image delivery via CDN

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Built with ❤️ for real-time communication

---

**Note:** Make sure to set up your MongoDB database and Cloudinary account before running the application.
