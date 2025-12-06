import React from 'react';

function ChatMessage({ message, isOwn }) {
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (message.senderRole === 'system') {
        return (
            <div className="message system-message">
                {message.message}
            </div>
        );
    }

    return (
        <div className={`message ${isOwn ? 'own-message' : 'other-message'}`}>
            <div className="message-sender">{message.sender}</div>
            <div className="message-text">{message.message}</div>
            <div className="message-time">{formatTime(message.timestamp)}</div>
        </div>
    );
}

export default ChatMessage;
