import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Avatar from '../../components/shared/Avatar';
import { warningsApi } from '../../api/warningsApi';
import { toast } from 'react-toastify';

const WARNING_TYPES = [
  { value: 'LOW_ACTIVITY', label: 'Low Activity' },
  { value: 'MISSED_FOLLOWUPS', label: 'Missed Follow-ups' },
  { value: 'OVERDUE_INTERVENTIONS', label: 'Overdue Interventions' },
  { value: 'GENERAL', label: 'General' },
  { value: 'EXCELLENT_WORK', label: 'Excellent Work' },
];

const TEMPLATES = {
  LOW_ACTIVITY: 'This is a formal notice regarding your recent activity. Our records show insufficient updates to cases in the past 7 days. Please improve your effort and ensure cases are updated regularly.',
  MISSED_FOLLOWUPS: 'This notice is regarding missed follow-up dates on assigned cases. Please review your cases and reschedule or complete overdue follow-ups.',
  OVERDUE_INTERVENTIONS: 'Several interventions under your responsibility are overdue. Please update their status or complete them as soon as possible.',
  EXCELLENT_WORK: 'This is a formal commendation for your excellent performance this period. Keep up the great work!',
  GENERAL: '',
};

export default function WarningModal({ isOpen, onClose, toUser, relatedCase, cases = [], onSuccess }) {
  const [warningType, setWarningType] = useState('LOW_ACTIVITY');
  const [message, setMessage] = useState('');
  const [relatedCaseId, setRelatedCaseId] = useState(relatedCase?.id || '');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setWarningType('LOW_ACTIVITY');
    setMessage(TEMPLATES.LOW_ACTIVITY || '');
    setRelatedCaseId(relatedCase?.id || '');
  }, [isOpen, relatedCase]);

  useEffect(() => {
    setMessage(TEMPLATES[warningType] || '');
  }, [warningType]);

  const handleSend = async () => {
    if (!toUser?.id || !message?.trim()) {
      toast.error('Message is required');
      return;
    }
    setSending(true);
    try {
      const res = await warningsApi.create({
        toUserId: toUser.id,
        warningType,
        message: message.trim(),
        relatedCaseId: relatedCaseId ? Number(relatedCaseId) : undefined,
      });
      const data = res?.data ?? res;
      toast.success(`Warning sent and delivered to ${toUser.fullName || toUser.fullName || 'recipient'}'s inbox`);
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to send warning');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Performance Warning">
      <div className="space-y-4">
        {toUser && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar name={toUser.fullName} size="md" />
            <div>
              <p className="font-medium text-gray-900">{toUser.fullName}</p>
              <p className="text-sm text-gray-500">{toUser.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warning Type</label>
          <select
            value={warningType}
            onChange={(e) => setWarningType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
          >
            {WARNING_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {cases?.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related Case (optional)</label>
            <select
              value={relatedCaseId}
              onChange={(e) => setRelatedCaseId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
            >
              <option value="">— None —</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
            placeholder="Enter warning message..."
          />
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Preview (as in inbox):</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-3">{message || '—'}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send Warning'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
