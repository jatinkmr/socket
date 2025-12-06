import React from 'react';

function ChatList({ chats, onSelectChat, activeRoomId }) {
    if (chats.length === 0) {
        return <div className="no-chats">No active chats</div>;
    }

    return (
        <div className="chat-list">
            {chats.map((chat) => (
                <div
                    key={chat.roomId}
                    className={`chat-item ${activeRoomId === chat.roomId ? 'active' : ''}`}
                    onClick={() => onSelectChat(chat)}
                >
                    <div className="chat-item-name">{chat.userName}</div>
                    <div className="chat-item-info">{chat.messageCount} messages</div>
                </div>
            ))}
        </div>
    );
}

export default ChatList;
