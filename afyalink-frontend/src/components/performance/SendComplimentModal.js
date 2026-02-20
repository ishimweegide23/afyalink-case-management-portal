import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../shared/Avatar';
import { warningsApi } from '../../api/warningsApi';
import { toast } from 'react-toastify';
import { HiOutlineThumbUp } from 'react-icons/hi';

const TEMPLATES = [
  'Outstanding performance this period! Keep up the excellent work.',
  'Your dedication and consistent results are exemplary. Thank you!',
  'Excellent work on case completion and timely reporting. Well done!',
  'Your high intervention success rate and attention to detail are commendable.',
];

export default function SendComplimentModal({ isOpen, onClose, user, suggestedAchievements = [], onSuccess }) {
  const [message, setMessage] = useState('');
  const [templateIndex, setTemplateIndex] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTemplateIndex(0);
    if (suggestedAchievements.length > 0) {
      setMessage(`Congratulations! ${suggestedAchievements.join('. ')}. Keep up the excellent work!`);
    } else {
      setMessage(TEMPLATES[0]);
    }
  }, [isOpen, suggestedAchievements]);

  const handleSend = async () => {
    if (!user?.id || !message?.trim()) {
      toast.error('Message is required');
      return;
    }
    setSending(true);
    try {
      await warningsApi.create({
        toUserId: user.id,
        warningType: 'EXCELLENT_WORK',
        message: message.trim(),
      });
      toast.success(`Compliment sent to ${user.fullName || 'recipient'}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to send compliment');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Compliment"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending} icon={HiOutlineThumbUp}>
            {sending ? 'Sending...' : 'Send Compliment'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {user && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <Avatar name={user.fullName} size="md" />
            <div>
              <p className="font-semibold text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        )}

        {suggestedAchievements.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Achievements to highlight</label>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                {suggestedAchievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setTemplateIndex(i); setMessage(TEMPLATES[i] || TEMPLATES[0]); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  templateIndex === i
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Option {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter compliment message..."
          />
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Preview (as delivered to inbox):</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-3">{message || '—'}</p>
        </div>
      </div>
    </Modal>
  );
}
