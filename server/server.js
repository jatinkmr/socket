require('dotenv').config()
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
// CORS configuration - allow React dev server (typically port 3000) to connect
const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"];

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const activeRooms = new Map(); // roomId -> {userId, userName, adminIds[], messages[]}
const connectedUsers = new Map(); // socketId -> {userId, userName, role, roomId}
const adminSockets = new Set();

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Get all active chats (for admin dashboard)
app.get('/api/admin/chats', (req, res) => {
    const chats = Array.from(activeRooms.entries()).map(([roomId, room]) => ({
        roomId,
        userId: room.userId,
        userName: room.userName,
        messageCount: room.messages.length,
        lastMessage: room.messages[room.messages.length - 1] || null,
        connectedAdmins: room.adminIds.length
    }));
    res.json({ chats });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`✅ New connection: ${socket.id}`);
    console.log(`   Transport: ${socket.conn.transport.name}`);

    socket.conn.on('upgrade', () => {
        console.log(`   Transport upgraded to: ${socket.conn.transport.name}`);
    });

    socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
    });

    // User joins chat
    socket.on('user-join', ({ userId, userName }) => {
        const roomId = `room_${userId}_${Date.now()}`;

        if (!activeRooms.has(roomId)) {
            activeRooms.set(roomId, {
                userId,
                userName,
                adminIds: [],
                messages: [],
                createdAt: new Date()
            });
        }

        socket.join(roomId);
        connectedUsers.set(socket.id, { userId, userName, role: 'user', roomId });

        socket.emit('room-joined', {
            roomId,
            userName,
            message: 'Connected to support. An admin will join shortly.'
        });

        io.to('admin-lobby').emit('new-chat-room', {
            roomId,
            userId,
            userName,
            timestamp: new Date()
        });

        console.log(`User ${userName} joined room ${roomId}`);
    });

    // Admin joins system
    socket.on('admin-join', ({ adminId, adminName }) => {
        adminSockets.add(socket.id);
        socket.join('admin-lobby');
        connectedUsers.set(socket.id, {
            userId: adminId,
            userName: adminName,
            role: 'admin',
            roomId: null
        });

        const rooms = Array.from(activeRooms.entries()).map(([roomId, room]) => ({
            roomId,
            userId: room.userId,
            userName: room.userName,
            messageCount: room.messages.length,
            connectedAdmins: room.adminIds.length
        }));

        socket.emit('admin-lobby-joined', { rooms });
        console.log(`Admin ${adminName} joined the system`);
    });

    // Admin joins specific chat room
    socket.on('admin-join-room', ({ roomId, adminId, adminName }) => {
        const room = activeRooms.get(roomId);

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        socket.join(roomId);
        if (!room.adminIds.includes(adminId)) {
            room.adminIds.push(adminId);
        }

        const adminData = connectedUsers.get(socket.id);
        if (adminData) {
            adminData.roomId = roomId;
        }

        socket.emit('room-history', {
            roomId,
            messages: room.messages,
            userName: room.userName
        });

        io.to(roomId).emit('admin-joined', {
            adminName,
            message: `${adminName} has joined the chat`
        });

        console.log(`Admin ${adminName} joined room ${roomId}`);
    });

    // User sends message
    socket.on('user-message', ({ roomId, message }) => {
        const userData = connectedUsers.get(socket.id);
        const room = activeRooms.get(roomId);

        if (!userData || !room) {
            socket.emit('error', { message: 'Invalid room or user' });
            return;
        }

        const messageData = {
            id: `msg_${Date.now()}_${Math.random()}`,
            sender: userData.userName,
            senderRole: 'user',
            message,
            timestamp: new Date()
        };

        room.messages.push(messageData);
        io.to(roomId).emit('new-message', messageData);

        adminSockets.forEach(adminSocketId => {
            const adminData = connectedUsers.get(adminSocketId);
            if (adminData && adminData.roomId !== roomId) {
                io.to(adminSocketId).emit('chat-notification', {
                    roomId,
                    userName: userData.userName,
                    message: message.substring(0, 50)
                });
            }
        });

        console.log(`User message in ${roomId}: ${message}`);
    });

    // Admin sends message
    socket.on('admin-message', ({ roomId, message }) => {
        const adminData = connectedUsers.get(socket.id);
        const room = activeRooms.get(roomId);

        if (!adminData || !room) {
            socket.emit('error', { message: 'Invalid room or admin' });
            return;
        }

        const messageData = {
            id: `msg_${Date.now()}_${Math.random()}`,
            sender: adminData.userName,
            senderRole: 'admin',
            message,
            timestamp: new Date()
        };

        room.messages.push(messageData);
        io.to(roomId).emit('new-message', messageData);

        console.log(`Admin message in ${roomId}: ${message}`);
    });

    // Typing indicators
    socket.on('user-typing', ({ roomId }) => {
        const userData = connectedUsers.get(socket.id);
        if (userData) {
            socket.to(roomId).emit('typing-indicator', {
                userName: userData.userName,
                role: 'user'
            });
        }
    });

    socket.on('admin-typing', ({ roomId }) => {
        const adminData = connectedUsers.get(socket.id);
        if (adminData) {
            socket.to(roomId).emit('typing-indicator', {
                userName: adminData.userName,
                role: 'admin'
            });
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        const userData = connectedUsers.get(socket.id);

        if (userData) {
            const { role, roomId, userName } = userData;

            if (role === 'admin') {
                adminSockets.delete(socket.id);

                if (roomId) {
                    const room = activeRooms.get(roomId);
                    if (room) {
                        room.adminIds = room.adminIds.filter(id => id !== userData.userId);
                        io.to(roomId).emit('admin-left', {
                            adminName: userName
                        });
                    }
                }
            } else if (role === 'user' && roomId) {
                io.to(roomId).emit('user-left', { userName });
            }

            connectedUsers.delete(socket.id);
            console.log(`${role} ${userName} disconnected`);
        }
    });
});

// Error handling
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop the process using this port.`);
    } else {
        console.error('❌ Server error:', error);
    }
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO server ready for connections`);
    console.log(`🌐 Allowed origins:`, allowedOrigins);
});