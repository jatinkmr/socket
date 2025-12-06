import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import ChatList from './ChatList';
import ChatMessage from './ChatMessage';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

function AdminDashboard() {
    const [socket, setSocket] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminName, setAdminName] = useState('');
    const [adminId, setAdminId] = useState('');
    const [chats, setChats] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [activeUserName, setActiveUserName] = useState('');
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const showNotification = (message) => {
        if (Notification.permission === 'granted') {
            new Notification('New Message', { body: message });
        }
    };

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log('✅ Admin socket connected successfully');
            socket.emit('admin-join', {
                adminId,
                adminName
            });
        };

        const handleAdminLobbyJoined = ({ rooms }) => {
            setChats(rooms);
            setIsLoggedIn(true);
        };

        const handleNewChatRoom = (room) => {
            setChats(prev => [...prev, room]);
            showNotification(`New chat from ${room.userName}`);
        };

        const handleRoomHistory = ({ messages: historyMessages, userName }) => {
            setMessages(historyMessages);
            setActiveUserName(userName);
        };

        const handleNewMessage = (data) => {
            setMessages(prev => [...prev, data]);
        };

        const handleChatNotification = ({ userName, message }) => {
            showNotification(`${userName}: ${message}`);
        };

        const handleTypingIndicator = ({ userName, role }) => {
            if (role === 'user') {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        };

        const handleUserLeft = ({ userName }) => {
            setMessages(prev => [...prev, {
                id: Date.now(),
                message: `${userName} left the chat`,
                senderRole: 'system',
                timestamp: new Date()
            }]);
        };

        const handleConnectError = (error) => {
            console.error('❌ Admin connection failed:', error);
            const errorMessage = error.message || 'Websocket error';
            alert(`Failed to connect to server.\n\nPlease make sure the server is running on port 5000.\n\nError: ${errorMessage}\n\nTry:\n1. Check if server is running: npm run server\n2. Verify server is on http://localhost:5000`);
            setIsLoggedIn(false);
        };

        const handleError = (error) => {
            console.error('Socket error:', error);
            alert('Connection error. Please try again.');
        };

        const handleDisconnect = (reason) => {
            console.log('Admin disconnected:', reason);
            setIsLoggedIn(false);
        };

        socket.on('connect', handleConnect);
        socket.on('connect_error', handleConnectError);
        socket.on('admin-lobby-joined', handleAdminLobbyJoined);
        socket.on('new-chat-room', handleNewChatRoom);
        socket.on('room-history', handleRoomHistory);
        socket.on('new-message', handleNewMessage);
        socket.on('chat-notification', handleChatNotification);
        socket.on('typing-indicator', handleTypingIndicator);
        socket.on('user-left', handleUserLeft);
        socket.on('error', handleError);
        socket.on('disconnect', handleDisconnect);

        // If already connected, emit admin-join immediately
        if (socket.connected) {
            socket.emit('admin-join', {
                adminId,
                adminName
            });
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleConnectError);
            socket.off('admin-lobby-joined', handleAdminLobbyJoined);
            socket.off('new-chat-room', handleNewChatRoom);
            socket.off('room-history', handleRoomHistory);
            socket.off('new-message', handleNewMessage);
            socket.off('chat-notification', handleChatNotification);
            socket.off('typing-indicator', handleTypingIndicator);
            socket.off('user-left', handleUserLeft);
            socket.off('error', handleError);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket, adminId, adminName]);

    const handleAdminLogin = (e) => {
        e.preventDefault();
        if (!adminName.trim() || !adminId.trim()) {
            alert('Please enter admin name and ID');
            return;
        }

        console.log(`Attempting to connect to ${SOCKET_URL}...`);
        const newSocket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000, // Increased timeout
            forceNew: true,
            upgrade: true
        });

        setSocket(newSocket);
    };

    const handleSelectChat = (chat) => {
        setActiveRoomId(chat.roomId);
        setMessages([]);

        if (socket) {
            socket.emit('admin-join-room', {
                roomId: chat.roomId,
                adminId,
                adminName
            });
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeRoomId || !socket) return;

        socket.emit('admin-message', {
            roomId: activeRoomId,
            message: messageInput
        });

        setMessageInput('');
    };

    const handleTyping = () => {
        if (activeRoomId && socket) {
            socket.emit('admin-typing', { roomId: activeRoomId });
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="login-screen">
                <div className="login-box admin-login">
                    <h1>👔 Admin Portal</h1>
                    <p>Login to access the support dashboard</p>
                    <form onSubmit={handleAdminLogin}>
                        <input
                            type="text"
                            placeholder="Admin Name"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Admin ID"
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
                            required
                        />
                        <button type="submit" className="primary-btn admin-btn">Login</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Active Chats</h2>
                    <span className="badge">{chats.length}</span>
                </div>
                <ChatList
                    chats={chats}
                    onSelectChat={handleSelectChat}
                    activeRoomId={activeRoomId}
                />
            </div>

            <div className="main-content">
                <div className="chat-header">
                    <div>
                        <h2>{activeUserName ? `Chat with ${activeUserName}` : 'Select a chat'}</h2>
                        <p className="status">Logged in as {adminName}</p>
                    </div>
                </div>

                <div className="messages-container">
                    {!activeRoomId ? (
                        <div className="welcome-message">
                            <h3>👋 Welcome to Admin Dashboard</h3>
                            <p>Select a chat from the sidebar to start responding to customers</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg}
                                    isOwn={msg.senderRole === 'admin'}
                                />
                            ))}
                            {isTyping && (
                                <div className="typing-indicator">User is typing...</div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                <form className="input-area" onSubmit={sendMessage}>
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => {
                            setMessageInput(e.target.value);
                            handleTyping();
                        }}
                        disabled={!activeRoomId}
                    />
                    <button
                        type="submit"
                        className="primary-btn admin-btn"
                        disabled={!activeRoomId}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminDashboard;