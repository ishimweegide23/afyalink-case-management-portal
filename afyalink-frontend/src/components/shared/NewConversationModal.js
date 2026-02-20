import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { messageApi } from '../../api/messageApi';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Avatar from './Avatar';
import { USER_ROLES } from '../../utils/constants';
import { API_BASE_URL } from '../../utils/constants';
import {
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineX,
  HiOutlineChat,
} from 'react-icons/hi';

const CONV_TYPES = {
  DIRECT: 'Direct message',
  GROUP: 'New group',
  TEAM: 'Team group (your social workers)',
  ALL: 'All staff announcement',
};

function resolveAvatarSrc(avatar) {
  if (!avatar) return undefined;
  if (avatar.startsWith('http')) return avatar;
  return `${API_BASE_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
}

export default function NewConversationModal({ isOpen, onClose, onSelect, currentUser }) {
  const [step, setStep] = useState(1);
  const [convType, setConvType] = useState('');
  const [groupName, setGroupName] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchUser, setSearchUser] = useState('');

  const role = currentUser?.role || '';

  const options = [];
  if (role === USER_ROLES.ADMIN) {
    options.push({ key: 'ALL', label: CONV_TYPES.ALL, icon: HiOutlineUsers });
    options.push({ key: 'GROUP', label: CONV_TYPES.GROUP, icon: HiOutlineUserGroup });
    options.push({ key: 'DIRECT', label: CONV_TYPES.DIRECT, icon: HiOutlineUser });
  } else if (role === USER_ROLES.SUPERVISOR) {
    options.push({ key: 'TEAM', label: CONV_TYPES.TEAM, icon: HiOutlineUsers });
    options.push({ key: 'GROUP', label: CONV_TYPES.GROUP, icon: HiOutlineUserGroup });
    options.push({ key: 'DIRECT', label: CONV_TYPES.DIRECT, icon: HiOutlineUser });
  } else {
    options.push({ key: 'DIRECT', label: CONV_TYPES.DIRECT, icon: HiOutlineUser });
  }

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await messageApi.getMessageableUsers();
      const raw = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(raw) ? raw : [];
      setUsers(list);
    } catch {
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && step === 2) fetchUsers();
  }, [isOpen, step, fetchUsers]);

  const filteredUsers = searchUser
    ? users.filter(
        (u) =>
          (u.fullName || '').toLowerCase().includes(searchUser.toLowerCase()) ||
          (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
      )
    : users;

  const teamWorkers = users.filter((u) => u.role === USER_ROLES.SOCIAL_WORKER);

  useEffect(() => {
    if (convType === 'TEAM' && teamWorkers.length > 0 && selectedIds.length === 0) {
      setSelectedIds(teamWorkers.map((u) => u.id));
    }
  }, [convType, teamWorkers, selectedIds.length]);

  const handleChooseType = (key) => {
    setConvType(key);
    setStep(2);
    setSelectedIds([]);
    setGroupName('');
    setInitialMessage('');
    if (key === 'TEAM') {
      setGroupName(
        currentUser?.assignedDistrict ? `Team ${currentUser.assignedDistrict}` : 'My team'
      );
    }
    if (key === 'ALL') {
      setGroupName('AfyaLink - All Staff');
    }
  };

  const handleConfirm = async () => {
    if (convType === 'ALL') {
      if (!groupName.trim()) {
        toast.error('Enter a group name');
        return;
      }
      setCreating(true);
      try {
        const res = await messageApi.createAllStaffGroup({
          title: groupName.trim(),
          initialMessage: initialMessage.trim() || undefined,
        });
        const data = res?.data ?? res;
        const conversationId = data?.conversationId || 'grp-all-staff';
        onSelect({
          conversationId,
          conversationType: 'GROUP',
          conversationTitle: groupName.trim(),
          participants: JSON.stringify(users.map((u) => u.id).concat([currentUser?.id]).filter(Boolean)),
          caseId: null,
        });
        onClose();
        resetModal();
        toast.success('All-staff group ready');
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to create group');
      } finally {
        setCreating(false);
      }
      return;
    }

    if (convType === 'TEAM') {
      if (!groupName.trim()) {
        toast.error('Enter a team group name');
        return;
      }
      if (selectedIds.length === 0) {
        toast.error('Select at least one social worker');
        return;
      }
      setCreating(true);
      try {
        const res = await messageApi.createTeamGroup({
          title: groupName.trim(),
          initialMessage: initialMessage.trim() || undefined,
          memberIds: selectedIds,
        });
        const data = res?.data ?? res;
        const conversationId = data?.conversationId;
        const allIds = [...new Set([...selectedIds, currentUser?.id])];
        onSelect({
          conversationId,
          conversationType: 'TEAM',
          conversationTitle: groupName.trim(),
          participants: JSON.stringify(allIds),
          caseId: null,
        });
        onClose();
        resetModal();
        toast.success('Team group created');
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to create team group');
      } finally {
        setCreating(false);
      }
      return;
    }

    let participantIds = [];
    let title = '';
    let type = 'DIRECT';
    let conversationId = '';

    if (convType === 'GROUP') {
      if (!groupName.trim()) {
        toast.error('Enter a group name');
        return;
      }
      if (selectedIds.length === 0) {
        toast.error('Select at least one participant');
        return;
      }
      participantIds = [...selectedIds, currentUser?.id].filter(Boolean);
      title = groupName.trim();
      type = 'GROUP';
      conversationId = 'grp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    } else {
      if (selectedIds.length !== 1) {
        toast.error('Select one person to message');
        return;
      }
      const u = users.find((x) => x.id === selectedIds[0]);
      title = u?.fullName || u?.email || 'Direct';
      type = 'DIRECT';
      participantIds = [selectedIds[0], currentUser?.id].filter(Boolean);
      const sorted = participantIds.slice().sort((a, b) => a - b);
      conversationId = 'dir-' + sorted.join('-');
    }

    onSelect({
      conversationId,
      conversationType: type,
      conversationTitle: title,
      participants: JSON.stringify(participantIds),
      caseId: null,
    });
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setStep(1);
    setConvType('');
    setGroupName('');
    setInitialMessage('');
    setSelectedIds([]);
    setSearchUser('');
  };

  const toggleUser = (id) => {
    if (convType === 'DIRECT') {
      setSelectedIds(selectedIds[0] === id ? [] : [id]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const selectAll = () => {
    if (convType === 'TEAM') {
      setSelectedIds(teamWorkers.map((u) => u.id));
    } else {
      setSelectedIds(filteredUsers.map((u) => u.id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiOutlineChat className="w-5 h-5 text-primary" />
            New conversation
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">Choose how you want to start</p>
              {options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleChooseType(opt.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-gray-900">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {(convType === 'GROUP' || convType === 'TEAM' || convType === 'ALL') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. Team Gasabo"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  {(convType === 'ALL' || convType === 'TEAM') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Announcement (optional)</label>
                      <textarea
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        placeholder="Welcome message or announcement..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  )}
                </>
              )}

              {convType === 'ALL' && (
                <p className="text-sm text-gray-600">
                  Creates a channel visible to all admins, supervisors, and social workers. Everyone receives a notification.
                </p>
              )}

              {convType === 'TEAM' && (
                <>
                  <p className="text-sm text-gray-600">
                    Select social workers assigned to you. They will see this group and receive notifications.
                  </p>
                  {teamWorkers.length > 0 && (
                    <button type="button" onClick={selectAll} className="text-sm text-primary font-medium hover:underline">
                      Select all team workers ({teamWorkers.length})
                    </button>
                  )}
                </>
              )}

              {(convType === 'GROUP' || convType === 'DIRECT' || convType === 'TEAM') && (
                <>
                  {convType !== 'TEAM' && (
                    <input
                      type="text"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  )}
                  {convType === 'GROUP' && filteredUsers.length > 0 && (
                    <button type="button" onClick={selectAll} className="text-xs text-primary font-medium hover:underline">
                      Select all
                    </button>
                  )}
                  {loadingUsers ? (
                    <div className="flex justify-center py-8"><Spinner size="md" /></div>
                  ) : (
                    <ul className="space-y-1 max-h-60 overflow-y-auto">
                      {(convType === 'TEAM' ? teamWorkers : filteredUsers).map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => toggleUser(u.id)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                              selectedIds.includes(u.id) ? 'bg-primary/15 border-2 border-primary/40' : 'hover:bg-gray-50 border-2 border-transparent'
                            }`}
                          >
                            <Avatar name={u.fullName} src={resolveAvatarSrc(u.avatarUrl)} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{u.fullName || u.email}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                            <span className="text-xs text-gray-400">{u.role?.replace('_', ' ')}</span>
                            {selectedIds.includes(u.id) && (
                              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">✓</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2">
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1" disabled={creating}>
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1"
                loading={creating}
                disabled={
                  creating ||
                  (convType === 'GROUP' && (!groupName.trim() || selectedIds.length === 0)) ||
                  (convType === 'DIRECT' && selectedIds.length !== 1) ||
                  (convType === 'TEAM' && (!groupName.trim() || selectedIds.length === 0)) ||
                  (convType === 'ALL' && !groupName.trim()) ||
                  ((convType === 'GROUP' || convType === 'DIRECT' || convType === 'TEAM') && loadingUsers)
                }
              >
                Start conversation
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
