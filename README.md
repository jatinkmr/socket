# Real-Time Chat System

A full-stack real-time chat application built with React and Socket.IO, featuring separate interfaces for users and admins to facilitate customer support conversations.

## Features

- **Real-Time Messaging**: Instant communication between users and admins using WebSockets
- **Dual Interfaces**: Separate user chat interface and admin dashboard
- **Room Management**: Dynamic chat rooms for individual user-admin conversations
- **Typing Indicators**: Real-time typing status for better user experience
- **Admin Dashboard**: Overview of all active chats with the ability to join and manage conversations
- **Notifications**: Alerts for admins when new messages arrive in other rooms
- **CORS Support**: Configurable allowed origins for client connections

## Tech Stack

### Frontend
- React 19.2.1
- Socket.IO Client 4.8.1
- React Testing Library

### Backend
- Node.js with Express 5.2.1
- Socket.IO Server 4.8.1
- CORS middleware
- Nodemon for development

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd socket-io
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional):
   Create a `.env` file in the root directory:
   ```
   CLIENT_URL=http://localhost:3000,http://localhost:3001
   ```

4. Start the development servers:
   - Start the backend server:
     ```bash
     npm run server
     ```
   - In a new terminal, start the React app:
     ```bash
     npm start
     ```

The application will be available at `http://localhost:3000` and the server at `http://localhost:5000`.

## Usage

1. Open the application in your browser
2. Choose between "User Chat" or "Admin Dashboard"
3. **For Users**: Enter your name and start chatting with support
4. **For Admins**: View active chats, join conversations, and respond to users

### API Endpoints

- `GET /api/health` - Server health check
- `GET /api/admin/chats` - Get all active chat rooms (admin only)

### Socket Events

#### User Events
- `user-join` - Join a chat room
- `user-message` - Send a message
- `user-typing` - Indicate typing status

#### Admin Events
- `admin-join` - Join the admin system
- `admin-join-room` - Join a specific chat room
- `admin-message` - Send a message as admin
- `admin-typing` - Indicate typing status

## Scripts

- `npm start` - Start the React development server
- `npm run server` - Start the backend server with nodemon
- `npm run build` - Build the React app for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

## Project Structure

```
socket-io/
├── public/                 # Static assets
├── server/
│   └── server.js          # Express/Socket.IO server
├── src/
│   ├── components/        # React components
│   │   ├── UserChat.jsx   # User chat interface
│   │   ├── AdminDashboard.jsx # Admin management interface
│   │   ├── ChatList.jsx   # Chat list component
│   │   └── ChatMessage.jsx # Message component
│   ├── App.js             # Main React app
│   └── index.js           # App entry point
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.
