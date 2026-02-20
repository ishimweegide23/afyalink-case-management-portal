import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../shared/Avatar';
import { warningsApi } from '../../api/warningsApi';
import { toast } from 'react-toastify';
import { HiOutlineExclamation } from 'react-icons/hi';

const WARNING_TYPES = [
  { value: 'LOW_ACTIVITY', label: 'Low Activity' },
  { value: 'MISSED_FOLLOWUPS', label: 'Missed Follow-ups' },
  { value: 'OVERDUE_INTERVENTIONS', label: 'Overdue Interventions' },
  { value: 'GENERAL', label: 'General' },
];

const TEMPLATES = {
  LOW_ACTIVITY: 'This is a formal notice regarding your recent activity.',
  MISSED_FOLLOWUPS: 'This notice is regarding missed follow-up dates on assigned cases.',
  OVERDUE_INTERVENTIONS: 'Several interventions under your responsibility are overdue.',
  GENERAL: 'This is a formal notice regarding your performance.',
};

export default function SendWarningModal({ isOpen, onClose, user, suggestedReasons = [], onSuccess }) {
  const [warningType, setWarningType] = useState('GENERAL');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setWarningType('GENERAL');
    if (suggestedReasons.length > 0) {
      setMessage('Please address the following concerns:\n• ' + suggestedReasons.join('\n• '));
    } else {
      setMessage(TEMPLATES.GENERAL);
    }
  }, [isOpen, suggestedReasons]);

  const handleSend = async () => {
    if (!user?.id || !message?.trim()) {
      toast.error('Message is required');
      return;
    }
    setSending(true);
    try {
      await warningsApi.create({ toUserId: user.id, warningType, message: message.trim() });
      toast.success('Warning sent');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to send warning');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Performance Warning"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending} icon={HiOutlineExclamation}>
            {sending ? 'Sending...' : 'Send Warning'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {user && (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
            <Avatar name={user.fullName} size="md" />
            <div>
              <p className="font-semibold text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        )}
        {suggestedReasons.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Suggested issues:</p>
            <ul className="text-sm text-gray-800 list-disc list-inside">{suggestedReasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warning Type</label>
          <select
            value={warningType}
            onChange={(e) => setWarningType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {WARNING_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Tip:</strong> Supervisors can only have one <em>unresolved</em> warning of each type from the same sender.
            As admin, you can send follow-ups even if one is already open. Prefer <strong>General</strong> for broad performance feedback.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
      </div>
    </Modal>
  );
}
