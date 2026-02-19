import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../shared/Avatar';
import { performanceApi } from '../../api/performanceApi';
import { toast } from 'react-toastify';
import { HiOutlineSwitchHorizontal, HiOutlineRefresh } from 'react-icons/hi';

function sameId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

export default function ReassignSocialWorkerModal({ isOpen, onClose, socialWorker, supervisors = [], onSuccess }) {
  const [newSupervisorId, setNewSupervisorId] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [localSupervisors, setLocalSupervisors] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const supervisorList = localSupervisors.length > 0 ? localSupervisors : supervisors;

  const oldSupervisor = socialWorker?.supervisorId
    ? supervisorList.find((s) => sameId(s.id, socialWorker.supervisorId))
    : null;
  const newSupervisor = supervisorList.find((s) => sameId(s.id, newSupervisorId));

  useEffect(() => {
    if (!isOpen) return;
    setNewSupervisorId('');
    setReason('Workload rebalancing');
    setLocalSupervisors([]);
  }, [isOpen, socialWorker]);

  useEffect(() => {
    if (!isOpen) return;
    if (supervisors.length > 0) return;
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      try {
        const res = await performanceApi.getSupervisorWorkload();
        const list = res?.data ?? [];
        if (!cancelled) setLocalSupervisors(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setLocalSupervisors([]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, supervisors.length]);

  const loadSupervisors = async () => {
    setLoadingList(true);
    try {
      const res = await performanceApi.getSupervisorWorkload();
      setLocalSupervisors(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error('Could not load supervisors');
    } finally {
      setLoadingList(false);
    }
  };

  const handleConfirm = async () => {
    if (!socialWorker?.id || !newSupervisorId) {
      toast.error('Please select a new supervisor');
      return;
    }
    setSending(true);
    try {
      await performanceApi.reassignSocialWorker(socialWorker.id, Number(newSupervisorId), reason || undefined);
      toast.success('Reassigned successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to reassign');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Social Worker"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={sending || !newSupervisorId} icon={HiOutlineSwitchHorizontal}>
            {sending ? 'Reassigning...' : 'Confirm Reassignment'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {socialWorker && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
            <Avatar name={socialWorker.fullName} size="md" />
            <div>
              <p className="font-semibold text-gray-900">{socialWorker.fullName}</p>
              <p className="text-sm text-gray-600">{socialWorker.email}</p>
              {oldSupervisor && <p className="text-sm text-gray-500 mt-1">Current: {oldSupervisor.fullName}</p>}
            </div>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">Select New Supervisor</label>
            <button
              type="button"
              onClick={loadSupervisors}
              disabled={loadingList}
              className="text-sm text-purple-600 font-medium hover:text-purple-800 inline-flex items-center gap-1 disabled:opacity-50"
            >
              <HiOutlineRefresh className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
              Refresh list
            </button>
          </div>
          {loadingList && supervisorList.length === 0 ? (
            <p className="text-sm text-gray-500 py-3">Loading supervisors…</p>
          ) : supervisorList.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              No supervisors loaded. Check your connection or tap Refresh list.
            </p>
          ) : (
            <select
              value={newSupervisorId}
              onChange={(e) => setNewSupervisorId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Choose a supervisor…</option>
              {supervisorList
                .filter((s) => !sameId(s.id, socialWorker?.supervisorId))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} — {s.teamSize ?? 0} workers
                    {s.avgTeamPerformance != null ? ` (avg ${s.avgTeamPerformance}%)` : ''}
                  </option>
                ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Workload rebalancing..." />
        </div>
        {oldSupervisor && newSupervisor && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-2">Impact</p>
            <p className="text-sm text-gray-600">{oldSupervisor.fullName}: {oldSupervisor.teamSize} to {oldSupervisor.teamSize - 1} workers</p>
            <p className="text-sm text-gray-600">{newSupervisor.fullName}: {newSupervisor.teamSize} to {newSupervisor.teamSize + 1} workers</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
