import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { messageApi } from '../../api/messageApi';
import Avatar from './Avatar';
import { HiOutlineX, HiOutlinePaperAirplane } from 'react-icons/hi';
import Button from '../common/Button';

export default function ForwardModal({ isOpen, onClose, message, conversations, onSent }) {
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [sending, setSending] = useState(false);
  const [convList, setConvList] = useState([]);

  useEffect(() => {
    if (isOpen && conversations) {
      setConvList(conversations);
      setSelectedConvId(null);
    }
  }, [isOpen, conversations]);

  const handleForward = async () => {
    if (!selectedConvId || !message) return;
    const conv = convList.find((c) => c.conversationId === selectedConvId);
    if (!conv) return;
    setSending(true);
    try {
      const content = message.content
        ? `↪ Forwarded: ${message.content}`
        : '↪ Forwarded message';
      await messageApi.send({
        conversationId: conv.conversationId,
        conversationType: conv.conversationType || 'DIRECT',
        conversationTitle: conv.conversationTitle || conv.conversationId,
        participants: conv.participants || null,
        caseId: conv.caseId || null,
        content,
        attachments: message.attachments || null,
      });
      toast.success('Message forwarded');
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to forward');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const preview = (message?.content || '').slice(0, 60) + ((message?.content || '').length > 60 ? '…' : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Forward to</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        {message && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-gray-500 mb-1">From: {message.senderName}</p>
            <p className="text-sm text-gray-700 truncate">{preview}</p>
          </div>
        )}
        <ul className="overflow-y-auto flex-1 py-2">
          {convList.length === 0 ? (
            <li className="px-4 py-6 text-center text-gray-500 text-sm">No conversations</li>
          ) : (
            convList.map((c) => (
              <li key={c.conversationId}>
                <button
                  type="button"
                  onClick={() => setSelectedConvId(c.conversationId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left ${
                    selectedConvId === c.conversationId ? 'bg-primary/10' : ''
                  }`}
                >
                  <Avatar name={c.conversationTitle} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.conversationTitle || c.conversationId}</p>
                    {c.lastMessageContent && (
                      <p className="text-xs text-gray-500 truncate">{c.lastMessageContent}</p>
                    )}
                  </div>
                  {selectedConvId === c.conversationId && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">✓</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="p-4 border-t border-gray-100">
          <Button
            className="w-full"
            onClick={handleForward}
            disabled={!selectedConvId || sending}
            loading={sending}
            icon={HiOutlinePaperAirplane}
          >
            Forward
          </Button>
        </div>
      </div>
    </div>
  );
}
