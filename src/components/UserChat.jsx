import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import ChatMessage from './ChatMessage';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

function UserChat() {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [status, setStatus] = useState('Disconnected');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log('✅ User socket connected successfully');
            setIsConnected(true);
            setStatus('Connecting...');

            socket.emit('user-join', {
                userId: userEmail,
                userName: userName
            });
        };

        const handleRoomJoined = ({ roomId: newRoomId, message }) => {
            setRoomId(newRoomId);
            setStatus('Waiting for admin...');
            setMessages(prev => [...prev, {
                id: Date.now(),
                message,
                senderRole: 'system',
                timestamp: new Date()
            }]);
        };

        const handleAdminJoined = ({ adminName, message }) => {
            setStatus(`Connected - ${adminName}`);
            setMessages(prev => [...prev, {
                id: Date.now(),
                message,
                senderRole: 'system',
                timestamp: new Date()
            }]);
        };

        const handleNewMessage = (data) => {
            setMessages(prev => [...prev, data]);
        };

        const handleTypingIndicator = ({ role }) => {
            if (role === 'admin') {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        };

        const handleAdminLeft = ({ adminName }) => {
            setStatus('Waiting for admin...');
            setMessages(prev => [...prev, {
                id: Date.now(),
                message: `${adminName} left the chat`,
                senderRole: 'system',
                timestamp: new Date()
            }]);
        };

        const handleDisconnect = (reason) => {
            console.log('User disconnected:', reason);
            setStatus('Disconnected');
            setIsConnected(false);
        };

        const handleConnectError = (error) => {
            console.error('❌ User connection failed:', error);
            const errorMessage = error.message || 'Websocket error';
            alert(`Failed to connect to server.\n\nPlease make sure the server is running on port 5000.\n\nError: ${errorMessage}\n\nTry:\n1. Check if server is running: npm run server\n2. Verify server is on http://localhost:5000`);
            setStatus('Connection Failed');
            setIsConnected(false);
        };

        const handleError = (error) => {
            console.error('Socket error:', error);
            alert('Connection error. Please try again.');
        };

        socket.on('connect', handleConnect);
        socket.on('connect_error', handleConnectError);
        socket.on('room-joined', handleRoomJoined);
        socket.on('admin-joined', handleAdminJoined);
        socket.on('new-message', handleNewMessage);
        socket.on('typing-indicator', handleTypingIndicator);
        socket.on('admin-left', handleAdminLeft);
        socket.on('disconnect', handleDisconnect);
        socket.on('error', handleError);

        // If already connected, emit user-join immediately
        if (socket.connected) {
            socket.emit('user-join', {
                userId: userEmail,
                userName: userName
            });
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleConnectError);
            socket.off('room-joined', handleRoomJoined);
            socket.off('admin-joined', handleAdminJoined);
            socket.off('new-message', handleNewMessage);
            socket.off('typing-indicator', handleTypingIndicator);
            socket.off('admin-left', handleAdminLeft);
            socket.off('disconnect', handleDisconnect);
            socket.off('error', handleError);
        };
    }, [socket, userEmail, userName]);

    const handleStartChat = (e) => {
        e.preventDefault();
        if (!userName.trim() || !userEmail.trim()) {
            alert('Please enter your name and email');
            return;
        }

        console.log(`Attempting to connect to ${SOCKET_URL}...`);
        setStatus('Connecting...');
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

    const sendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !roomId || !socket) return;

        socket.emit('user-message', {
            roomId,
            message: messageInput
        });

        setMessageInput('');
    };

    const handleTyping = () => {
        if (roomId && socket) {
            socket.emit('user-typing', { roomId });
        }
    };

    const handleEndChat = () => {
        if (window.confirm('Are you sure you want to end this chat?')) {
            socket?.disconnect();
            window.location.reload();
        }
    };

    if (!isConnected) {
        return (
            <div className="login-screen">
                <div className="login-box">
                    <h1>💬 Customer Support</h1>
                    <p>Enter your details to start chatting with our support team</p>
                    <form onSubmit={handleStartChat}>
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Your Email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="primary-btn">Start Chat</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-screen">
            <div className="chat-box">
                <div className="chat-header">
                    <div>
                        <h2>Support Chat</h2>
                        <p className="status">{status}</p>
                    </div>
                    <button className="end-btn" onClick={handleEndChat}>End Chat</button>
                </div>

                <div className="messages-container">
                    {messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            isOwn={msg.senderRole === 'user'}
                        />
                    ))}
                    {isTyping && (
                        <div className="typing-indicator">Admin is typing...</div>
                    )}
                    <div ref={messagesEndRef} />
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
                    />
                    <button type="submit" className="primary-btn">Send</button>
                </form>
            </div>
        </div>
    );
}

export default UserChat;
