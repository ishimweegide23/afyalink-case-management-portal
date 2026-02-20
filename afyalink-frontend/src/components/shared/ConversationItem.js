import React from 'react';
import Avatar from '../shared/Avatar';
import { formatRelativeTime } from '../../utils/formatDate';

export default function ConversationItem({ conversation, isActive, onClick }) {
  return (
    <div
      onClick={() => onClick?.(conversation)}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
        ${isActive ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'}`}
    >
      <Avatar name={conversation.participantName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">{conversation.participantName}</p>
          <span className="text-[10px] text-gray-400">{formatRelativeTime(conversation.lastMessageAt)}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{conversation.lastMessage}</p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="w-5 h-5 bg-primary rounded-full text-white text-[10px] flex items-center justify-center font-medium">
          {conversation.unreadCount}
        </span>
      )}
    </div>
  );
}
