import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { messageApi } from '../../api/messageApi';
import { warningsApi } from '../../api/warningsApi';
import { useAuth } from '../../context/AuthContext';
import EmojiPickerComponent from '../../components/chat/EmojiPicker';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import NewConversationModal from '../../components/shared/NewConversationModal';
import ForwardModal from '../../components/shared/ForwardModal';
import Avatar from '../../components/shared/Avatar';
import { formatDateTime, formatRelativeTime } from '../../utils/formatDate';
import { API_BASE_URL } from '../../utils/constants';
import {
  HiOutlineMail, HiOutlinePaperAirplane, HiOutlineChat,
  HiOutlinePaperClip, HiOutlinePhone,
  HiOutlineVideoCamera, HiOutlineDotsVertical, HiOutlineSearch,
  HiOutlineTrash, HiOutlineReply, HiOutlineArrowRight, HiOutlineX,
  HiOutlineUserGroup, HiOutlineUserAdd, HiOutlineUserRemove,
  HiOutlinePhotograph, HiOutlineInformationCircle, HiOutlineChevronLeft,
} from 'react-icons/hi';

function isGenericTitle(title) {
  if (!title) return true;
  const t = title.toLowerCase().trim();
  if (t === 'direct message' || t === 'direct' || t === 'dm') return true;
  if (/^dir[-_]/.test(t)) return true;
  if (/^direct[-_]/.test(t)) return true;  // catches direct_1_55, direct_1, etc.
  if (/^grp[-_]/.test(t)) return true;
  if (/^broadcast[-_]/.test(t)) return true;
  if (/^team[-_]\d/.test(t)) return true;
  return false;
}

function resolveConvName(conv, currentUserId, currentUserName) {
  if (conv._resolvedName) return conv._resolvedName;

  if (conv.otherParticipantName) return conv.otherParticipantName;

  if (conv.participantNames && conv.participantNames.length > 0) {
    const lowerCurrent = (currentUserName || '').toLowerCase();
    const others = conv.participantNames.filter(
      (n) => n && n.toLowerCase() !== lowerCurrent
    );
    if (others.length > 0) return others.join(', ');
  }

  // If the server already resolved a real name (non-generic), use it
  if (conv.conversationTitle && !isGenericTitle(conv.conversationTitle))
    return conv.conversationTitle;

  // Last message sender — prefer the OTHER person's name
  if (conv.lastMessageSenderName &&
      Number(conv.lastMessageSenderId) !== Number(currentUserId))
    return conv.lastMessageSenderName;

  // Even if the current user sent last, show their name (better than raw ID)
  if (conv.lastMessageSenderName) return conv.lastMessageSenderName;

  // Final fallback — raw ID cleaned up
  const id = conv.conversationId || '';
  const m = id.match(/(?:direct_|dir-)(\d+)[_-](\d+)/);
  if (m) return `User ${m[1] === String(currentUserId) ? m[2] : m[1]}`;

  return conv.conversationTitle || id || 'Conversation';
}

function isGroupConv(conv) {
  return conv?.conversationType === 'GROUP' || conv?.conversationType === 'TEAM';
}

function resolveAvatarSrc(avatar) {
  if (!avatar) return undefined;
  if (avatar.startsWith('http')) return avatar;
  return `${API_BASE_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [messagePage, setMessagePage] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const msgTopRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [searchInChat, setSearchInChat] = useState(false);
  const [searchInChatKeyword, setSearchInChatKeyword] = useState('');
  const [showConvMenu, setShowConvMenu] = useState(false);
  const [receivedWarnings, setReceivedWarnings] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    warningsApi.getReceived({ size: 100 }).then((res) => {
      const content = res?.content ?? res?.data ?? (Array.isArray(res) ? res : []);
      setReceivedWarnings(Array.isArray(content) ? content : []);
    }).catch(() => setReceivedWarnings([]));
  }, [user?.id]);

  const fetchConversations = useCallback(async () => {
    setLoadingConv(true);
    try {
      const res = await messageApi.getConversations();
      const raw = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);

      let contactMap = {};
      try {
        const uRes = await messageApi.getMessageableUsers();
        const contacts = uRes?.data ?? uRes;
        const arr = Array.isArray(contacts) ? contacts : [];
        arr.forEach((u) => {
          contactMap[u.id] = {
            name: u.fullName || u.email,
            avatar: u.avatarUrl,
          };
        });
      } catch { /* ignore */ }

      const enriched = list.map((conv) => {
        let pIds = [];
        if (conv.participantIds && Array.isArray(conv.participantIds)) pIds = conv.participantIds;
        else if (conv.participants) {
          try { pIds = JSON.parse(conv.participants); } catch { pIds = []; }
        }
        
        // If participants are missing, try to extract from conversationId for direct messages
        if (pIds.length === 0 && conv.conversationId) {
            const matches = conv.conversationId.match(/(?:direct_|dir-)(\d+)[_-](\d+)/);
            if (matches) {
                pIds = [Number(matches[1]), Number(matches[2])];
            }
        }

        const otherId = pIds.find((id) => Number(id) !== Number(user?.id));
        const other = otherId ? contactMap[otherId] : null;
        const isDirect = conv.conversationType === 'DIRECT' || (conv.conversationId || '').startsWith('dir');
        let avatarUrl = null;
        if (isGroupConv(conv)) {
            avatarUrl = conv.groupAvatar;
        } else if (isDirect) {
            avatarUrl = other?.avatar || null;
        } else {
            avatarUrl = conv.lastMessageSenderAvatar;
        }

        let next = { ...conv, avatarUrl };
        if (conv.otherParticipantName || !isGenericTitle(conv.conversationTitle)) return next;
        if (other?.name) {
          next = { ...next, _resolvedName: other.name };
        } else if (pIds.length > 0) {
          const names = pIds
            .filter((id) => Number(id) !== Number(user?.id))
            .map((id) => contactMap[id]?.name).filter(Boolean);
          if (names.length > 0) next = { ...next, _resolvedName: names.join(', ') };
        }
        return next;
      });

      setConversations(enriched);
    } catch (err) {
      const isNetwork = err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error');
      toast.error(isNetwork ? 'Cannot reach server.' : 'Failed to load conversations.');
      setConversations([]);
    } finally { setLoadingConv(false); }
  }, [user?.id]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversation');
    const messageId = params.get('message');
    if (!conversationId || conversations.length === 0) return;
    const conv = conversations.find((c) => c.conversationId === conversationId);
    if (conv) {
      setSelectedConv(conv);
      setMobileShowChat(true);
      if (messageId) {
        setTimeout(() => {
          document.getElementById(`msg-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 700);
      }
    }
  }, [location.search, conversations]);

  // Synchronize selectedConv with updated conversations (e.g. after avatar upload)
  useEffect(() => {
    if (selectedConv && conversations.length > 0) {
      const updated = conversations.find((c) => c.conversationId === selectedConv.conversationId);
      if (updated && (
        updated.avatarUrl !== selectedConv.avatarUrl ||
        updated.participants !== selectedConv.participants ||
        updated.conversationTitle !== selectedConv.conversationTitle ||
        updated.groupAvatar !== selectedConv.groupAvatar
      )) {
        setSelectedConv(updated);
      }
    }
  }, [conversations, selectedConv]);

  const fetchMessages = useCallback(async (convId, page = 0) => {
    if (!convId) return;
    setLoadingMsg(true);
    try {
      const res = await messageApi.getByConversation(convId, { page, size: 30, sortBy: 'createdAt', direction: 'DESC' });
      const raw = res?.data !== undefined ? res.data : res;
      const content = Array.isArray(raw?.content) ? raw.content : (Array.isArray(raw) ? raw : []);
      setMessages(content);
      setMessagePage({ page: raw?.page ?? 0, totalPages: raw?.totalPages ?? 0, totalElements: raw?.totalElements ?? 0 });
    } catch { toast.error('Failed to load messages'); setMessages([]); }
    finally { setLoadingMsg(false); }
  }, []);

  useEffect(() => {
    if (selectedConv) fetchMessages(selectedConv.conversationId);
    else setMessages([]);
  }, [selectedConv, fetchMessages]);

  useEffect(() => {
    if (msgTopRef.current) msgTopRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroupMembers = useCallback(async () => {
    if (!selectedConv) return;
    setLoadingMembers(true);
    try {
      let memberIds = [];
      if (selectedConv.participants) {
        try { memberIds = JSON.parse(selectedConv.participants); } catch { memberIds = []; }
      }
      if (selectedConv.participantIds) memberIds = selectedConv.participantIds;
      if (memberIds.length > 0) {
        const res = await messageApi.getMessageableUsers();
        const contacts = res?.data ?? res;
        const all = Array.isArray(contacts) ? contacts : [];
        const me = user?.id ? [{ id: user.id, fullName: user.fullName, email: user.email, role: user.role, avatarUrl: user.profile?.profilePictureUrl || user.profile?.avatarUrl }] : [];
        const members = [...me, ...all].filter((u) => memberIds.includes(u.id) || u.id === user?.id);
        const seen = new Set();
        setGroupMembers(members.filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true; }));
      } else {
        const uniqueNames = [...new Set(messages.map((m) => m.senderName).filter(Boolean))];
        setGroupMembers(uniqueNames.map((name, i) => ({ id: i, fullName: name })));
      }
    } catch { setGroupMembers([]); }
    finally { setLoadingMembers(false); }
  }, [selectedConv, messages, user?.id]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await messageApi.getMessageableUsers();
      const raw = res?.data ?? res;
      setAllUsers(Array.isArray(raw) ? raw : []);
    } catch { setAllUsers([]); }
  }, []);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      try {
        const res = await messageApi.uploadAttachment(files[i]);
        const data = res?.data ?? res;
        if (data?.url) setPendingAttachments((prev) => [...prev, { url: data.url, name: data.name ?? files[i].name, type: data.type ?? files[i].type }]);
      } catch { toast.error('Failed to upload ' + files[i].name); }
    }
    e.target.value = '';
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const content = (newMessage || '').trim();
    if (!content && pendingAttachments.length === 0) return;
    if (!selectedConv) { toast.error('Select a conversation first'); return; }
    setSending(true);
    try {
      await messageApi.send({
        conversationId: selectedConv.conversationId,
        conversationType: selectedConv.conversationType || 'DIRECT',
        conversationTitle: selectedConv.conversationTitle || selectedConv.conversationId,
        participants: selectedConv.participants || null,
        caseId: selectedConv.caseId || null,
        content: content || '',
        attachments: pendingAttachments.length > 0 ? JSON.stringify(pendingAttachments) : null,
        replyToMessageId: replyingTo?.id || null,
      });
      setNewMessage(''); setPendingAttachments([]); setReplyingTo(null);
      fetchMessages(selectedConv.conversationId);
      fetchConversations();
    } catch (err) { toast.error(err?.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  const handleAddMember = async (userId) => {
    if (!selectedConv) return;
    try {
      let memberIds = [];
      try { memberIds = JSON.parse(selectedConv.participants || '[]'); } catch { memberIds = []; }
      if (memberIds.includes(userId)) { toast.info('Already a member'); return; }
      memberIds.push(userId);
      const updatedParticipants = JSON.stringify(memberIds);
      setSelectedConv((prev) => ({ ...prev, participants: updatedParticipants }));
      await messageApi.send({
        conversationId: selectedConv.conversationId,
        conversationType: selectedConv.conversationType,
        conversationTitle: selectedConv.conversationTitle,
        participants: updatedParticipants,
        content: `📢 A new member was added to the group`,
        caseId: selectedConv.caseId || null,
      });
      toast.success('Member added');
      fetchGroupMembers();
      setShowAddMember(false);
    } catch { toast.error('Failed to add member'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedConv || userId === user?.id) return;
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      let memberIds = [];
      try { memberIds = JSON.parse(selectedConv.participants || '[]'); } catch { memberIds = []; }
      memberIds = memberIds.filter((id) => id !== userId);
      const updatedParticipants = JSON.stringify(memberIds);
      setSelectedConv((prev) => ({ ...prev, participants: updatedParticipants }));
      const removed = groupMembers.find((m) => m.id === userId);
      await messageApi.send({
        conversationId: selectedConv.conversationId,
        conversationType: selectedConv.conversationType,
        conversationTitle: selectedConv.conversationTitle,
        participants: updatedParticipants,
        content: `📢 ${removed?.fullName || 'A member'} was removed from the group`,
        caseId: selectedConv.caseId || null,
      });
      toast.success('Member removed');
      fetchGroupMembers();
    } catch { toast.error('Failed to remove member'); }
  };

  const canSend = (newMessage?.trim() || pendingAttachments.length > 0) && selectedConv;

  const filteredConversations = searchKeyword
    ? conversations.filter((c) =>
        resolveConvName(c, user?.id, user?.fullName).toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (c.lastMessageContent || '').toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : conversations;

  const messagesFiltered = searchInChatKeyword.trim()
    ? messages.filter((m) =>
        (m.content || '').toLowerCase().includes(searchInChatKeyword.toLowerCase()) ||
        (m.senderName || '').toLowerCase().includes(searchInChatKeyword.toLowerCase())
      )
    : messages;

  const mediaMessages = useMemo(() => {
    return messages.filter((m) => {
      if (!m.attachments) return false;
      try {
        const a = JSON.parse(m.attachments);
        return Array.isArray(a) && a.some((att) => (att.type || '').startsWith('image/'));
      } catch { return false; }
    });
  }, [messages]);

  const parseAttachments = (str) => {
    if (!str) return [];
    try { const a = JSON.parse(str); return Array.isArray(a) ? a : []; } catch { return []; }
  };

  const attachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const selectConversation = (conv) => {
    setSelectedConv(conv);
    setShowGroupInfo(false);
    setMobileShowChat(true);
  };

  const openGroupInfo = () => {
    setShowGroupInfo(true);
    setShowConvMenu(false);
    fetchGroupMembers();
  };

  const selectedConvName = selectedConv ? resolveConvName(selectedConv, user?.id, user?.fullName) : '';
  const isGroup = isGroupConv(selectedConv);
  const headerAvatar = useMemo(() => {
    if (!selectedConv) return undefined;
    if (selectedConv.avatarUrl) return resolveAvatarSrc(selectedConv.avatarUrl);
    if (isGroup) return undefined;
    if (!isGroup && messages.length > 0) {
      const other = messages.find((m) => Number(m.senderId) !== Number(user?.id));
      if (other?.senderAvatar) return resolveAvatarSrc(other.senderAvatar);
    }
    if (selectedConv.conversationType === 'DIRECT' || (selectedConv.conversationId || '').startsWith('dir')) return undefined;
    return resolveAvatarSrc(selectedConv.lastMessageSenderAvatar);
  }, [selectedConv, messages, isGroup, user?.id]);

  const addableUsers = useMemo(() => {
    if (!allUsers.length) return [];
    let memberIds = [];
    try { memberIds = JSON.parse(selectedConv?.participants || '[]'); } catch { memberIds = []; }
    const memberSet = new Set(memberIds);
    return allUsers.filter((u) => !memberSet.has(u.id) && u.id !== user?.id);
  }, [allUsers, selectedConv, user?.id]);

  const filteredAddable = addMemberSearch
    ? addableUsers.filter((u) => (u.fullName || u.email || '').toLowerCase().includes(addMemberSearch.toLowerCase()))
    : addableUsers;

  return (
    <div className="space-y-6">
      <NewConversationModal
        isOpen={showNewConvModal}
        onClose={() => setShowNewConvModal(false)}
        onSelect={(c) => { selectConversation(c); setShowNewConvModal(false); fetchConversations(); }}
        currentUser={user}
      />
      <ForwardModal isOpen={showForwardModal} onClose={() => { setShowForwardModal(false); setForwardMessage(null); }} message={forwardMessage} conversations={conversations} onSent={() => { fetchConversations(); fetchMessages(selectedConv?.conversationId); }} />

      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-100/80 bg-white shadow-lg shadow-gray-200/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />

        <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 160px)', minHeight: '520px' }}>
          {/* Sidebar - conversation list */}
          <div className={`lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 flex-shrink-0 bg-white flex flex-col ${mobileShowChat ? 'hidden lg:flex' : 'flex'}`}>
            <div className="px-4 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Chats</h2>
                <button onClick={() => setShowNewConvModal(true)} className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-md" title="New conversation">
                  <HiOutlineChat className="w-4 h-4" />
                </button>
              </div>
              <SearchBar value={searchKeyword} onChange={setSearchKeyword} placeholder="Search or start new chat" className="w-full" />
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingConv ? (
                <div className="flex justify-center py-12"><Spinner size="md" /></div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <HiOutlineChat className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">No conversations yet</p>
                  <Button size="sm" onClick={() => setShowNewConvModal(true)}>Start chatting</Button>
                </div>
              ) : (
                <ul>
                  {filteredConversations.map((conv) => {
                    const name = resolveConvName(conv, user?.id, user?.fullName);
                    const isActive = selectedConv?.conversationId === conv.conversationId;
                    const isGrp = isGroupConv(conv);
                    return (
                      <li key={conv.conversationId}>
                        <button type="button" onClick={() => selectConversation(conv)}
                          className={`w-full flex items-center gap-3 text-left px-4 py-3 transition-colors border-b border-gray-50 ${isActive ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                          <div className="relative flex-shrink-0">
                            <Avatar name={name} src={resolveAvatarSrc(conv.avatarUrl)} size="md" />
                            {isGrp && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center ring-2 ring-white"><HiOutlineUserGroup className="w-2.5 h-2.5 text-white" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`font-semibold truncate text-sm ${isActive ? 'text-primary' : 'text-gray-900'}`}>{name}</p>
                              {conv.lastMessageTime && <span className="text-[10px] text-gray-400 flex-shrink-0">{formatRelativeTime(conv.lastMessageTime)}</span>}
                            </div>
                            {conv.lastMessageContent && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessageSenderName ? `${conv.lastMessageSenderName}: ` : ''}{conv.lastMessageContent}</p>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex min-w-0 ${!mobileShowChat ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex-1 flex flex-col min-w-0">
              {!selectedConv ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineMail className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Your Messages</h3>
                    <p className="text-sm text-gray-400 mb-4">Select a conversation or start a new one</p>
                    <Button onClick={() => setShowNewConvModal(true)} icon={HiOutlineChat}>New conversation</Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => setMobileShowChat(false)} className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden flex-shrink-0">
                      <HiOutlineChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={isGroup ? openGroupInfo : undefined} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="relative flex-shrink-0">
                        <Avatar name={selectedConvName} src={headerAvatar} size="md" />
                        {isGroup && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center ring-2 ring-white"><HiOutlineUserGroup className="w-2.5 h-2.5 text-white" /></div>}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-gray-900 truncate text-sm">{selectedConvName}</h2>
                        <p className="text-[11px] text-gray-400">
                          {isGroup ? `Group · tap for info` : 'tap for contact info'}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Voice call"><HiOutlinePhone className="w-5 h-5" /></button>
                      <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Video call"><HiOutlineVideoCamera className="w-5 h-5" /></button>
                      <div className="relative">
                        <button onClick={() => setShowConvMenu((v) => !v)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><HiOutlineDotsVertical className="w-5 h-5" /></button>
                        {showConvMenu && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowConvMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 py-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 min-w-[200px]">
                              {isGroup && (
                                <button onClick={openGroupInfo} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                  <HiOutlineInformationCircle className="w-4 h-4 text-gray-400" /> Group info
                                </button>
                              )}
                              <button onClick={() => { setSearchInChat(true); setShowConvMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                <HiOutlineSearch className="w-4 h-4 text-gray-400" /> Search in conversation
                              </button>
                              {mediaMessages.length > 0 && (
                                <button onClick={() => { openGroupInfo(); setShowConvMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                  <HiOutlinePhotograph className="w-4 h-4 text-gray-400" /> Media &amp; files
                                </button>
                              )}
                              <div className="border-t border-gray-100 mt-1 pt-1">
                                <button onClick={() => { if (window.confirm('Clear chat from this view?')) { setMessages([]); setShowConvMenu(false); toast.info('Chat cleared'); } }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
                                  <HiOutlineTrash className="w-4 h-4" /> Clear chat
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Search in chat bar */}
                  {searchInChat && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
                      <HiOutlineSearch className="w-4 h-4 text-gray-400" />
                      <input type="text" value={searchInChatKeyword} onChange={(e) => setSearchInChatKeyword(e.target.value)}
                        placeholder="Search in this chat..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white" autoFocus />
                      <button onClick={() => { setSearchInChat(false); setSearchInChatKeyword(''); }} className="text-sm text-primary font-medium hover:underline">Done</button>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d1d5db\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                    {loadingMsg ? (
                      <div className="flex justify-center py-12"><Spinner size="md" /></div>
                    ) : messagesFiltered.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="bg-white/80 rounded-xl px-6 py-4 text-center shadow-sm">
                          <p className="text-sm text-gray-500">{searchInChatKeyword ? 'No messages match your search.' : 'No messages yet. Say hi!'}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div ref={msgTopRef} />
                        {messagesFiltered.map((msg) => {
                          const isMe = Number(user?.id) === Number(msg.senderId);
                          const attachments = parseAttachments(msg.attachments);
                          const warning = receivedWarnings.find((w) => String(w.messageId || w.message_id) === String(msg.id));
                          const isExcellent = warning?.warningType === 'EXCELLENT_WORK';
                          return (
                            <div key={msg.id} id={`msg-${msg.id}`} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                              {!isMe && <Avatar name={msg.senderName} src={resolveAvatarSrc(msg.senderAvatar)} size="sm" className="flex-shrink-0 mt-1" />}
                              <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && isGroup && <p className="text-[11px] font-semibold text-primary mb-0.5 px-1">{msg.senderName}</p>}
                                <div className="group relative flex items-start gap-1">
                                  <div className={`rounded-2xl px-3.5 py-2 shadow-sm ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md'} ${msg.messageType === 'ANNOUNCEMENT' && warning ? `border-l-4 ${isExcellent ? 'border-l-green-500' : 'border-l-orange-500'}` : ''}`}>
                                    {msg.messageType === 'ANNOUNCEMENT' && warning && (
                                      <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                                        {isExcellent ? '🌟 Commendation' : '⚠️ Warning'}
                                        {!isExcellent && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px]">{warning.warningType?.replace(/_/g, ' ')}</span>}
                                      </p>
                                    )}
                                    {msg.replyToMessageId && (msg.replyToContent || msg.replyToSenderName) && (
                                      <div className={`mb-2 pl-2 border-l-2 ${isMe ? 'border-white/60' : 'border-primary/50'} text-xs opacity-90 rounded bg-black/5 p-1.5`}>
                                        <p className="font-semibold">{msg.replyToSenderName}</p>
                                        <p className="truncate max-w-[200px]">{msg.replyToContent}</p>
                                      </div>
                                    )}
                                    {msg.content && <p className="text-[13px] whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}
                                    {attachments.length > 0 && (
                                      <div className="mt-1.5 space-y-1">
                                        {attachments.map((att, idx) => {
                                          const url = attachmentUrl(att.url);
                                          const isImage = (att.type || '').startsWith('image/');
                                          return isImage ? (
                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={att.name} className="max-w-full rounded-lg max-h-48 object-contain" /></a>
                                          ) : (
                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className={`text-sm underline flex items-center gap-1 ${isMe ? 'text-white/90' : 'text-primary'}`}>
                                              <HiOutlinePaperClip className="w-3.5 h-3.5" /> {att.name}
                                            </a>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>{formatDateTime(msg.createdAt)}</p>
                                    {msg.messageType === 'ANNOUNCEMENT' && warning && !warning.isResolved && !isMe && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <button disabled={resolvingId === warning.id}
                                          onClick={async () => { setResolvingId(warning.id); try { await warningsApi.resolve(warning.id); setReceivedWarnings((p) => p.map((w) => w.id === warning.id ? { ...w, isResolved: true } : w)); toast.success('Resolved'); } catch { toast.error('Failed'); } finally { setResolvingId(null); } }}
                                          className="text-xs font-medium text-primary hover:underline">{resolvingId === warning.id ? 'Resolving...' : 'Mark as Resolved'}</button>
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isMe ? 'order-first' : ''}`}>
                                    <button onClick={() => setReplyingTo({ id: msg.id, content: msg.content, senderName: msg.senderName })} className="p-1 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-primary" title="Reply"><HiOutlineReply className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => { setForwardMessage(msg); setShowForwardModal(true); }} className="p-1 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-primary" title="Forward"><HiOutlineArrowRight className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* Message input */}
                  <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
                    {replyingTo && (
                      <div className="flex items-center justify-between gap-2 mb-2 px-3 py-2 bg-primary-50 rounded-xl border-l-4 border-primary">
                        <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-primary">{replyingTo.senderName}</p><p className="text-xs text-gray-600 truncate">{replyingTo.content || '(attachment)'}</p></div>
                        <button type="button" onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 p-1"><HiOutlineX className="w-4 h-4" /></button>
                      </div>
                    )}
                    {pendingAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {pendingAttachments.map((att, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">
                            <HiOutlinePaperClip className="w-3 h-3" /> {att.name}
                            <button type="button" onClick={() => setPendingAttachments((p) => p.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-600 ml-1">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <EmojiPickerComponent
                        onEmojiSelect={(emoji) => setNewMessage((p) => p + emoji)}
                        buttonClassName="p-2.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                      />
                      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileChange} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full hover:bg-gray-100 text-gray-500" title="Attach"><HiOutlinePaperClip className="w-5 h-5" /></button>
                      <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50" disabled={sending} />
                      <button type="submit" disabled={!canSend || sending} className={`p-2.5 rounded-full transition-colors ${canSend ? 'bg-primary text-white hover:bg-primary-600 shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                        <HiOutlinePaperAirplane className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Group info panel */}
            {showGroupInfo && selectedConv && (
              <div className="w-80 border-l border-gray-100 bg-white flex flex-col flex-shrink-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => { setShowGroupInfo(false); setShowAddMember(false); }} className="p-1.5 rounded-lg hover:bg-gray-100"><HiOutlineX className="w-5 h-5 text-gray-500" /></button>
                  <h3 className="font-bold text-gray-900 text-sm">{isGroup ? 'Group Info' : 'Contact Info'}</h3>
                </div>
                <div className="overflow-y-auto flex-1">
                  {/* Avatar + name */}
                  <div className="flex flex-col items-center py-6 px-4 bg-gray-50 border-b border-gray-100 relative group">
                    <div className="relative">
                      <Avatar name={selectedConvName} src={headerAvatar} size="xl" />
                      {isGroup && (
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-primary-600 transition-colors ring-2 ring-white" title="Change group avatar">
                          <HiOutlinePhotograph className="w-4 h-4" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                toast.info('Uploading group avatar...');
                                await messageApi.updateGroupAvatar(selectedConv.conversationId, file);
                                toast.success('Group avatar updated!');
                                // Instantly update UI with the selected image
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setSelectedConv(prev => ({
                                    ...prev, 
                                    groupAvatar: reader.result, 
                                    avatarUrl: reader.result 
                                  }));
                                };
                                reader.readAsDataURL(file);
                                fetchConversations();
                              } catch (err) {
                                toast.error('Failed to update group avatar');
                              }
                            }} 
                          />
                        </label>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-col items-center gap-2 max-w-full">
                      {isGroup ? (
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-gray-900 text-center truncate">{selectedConvName}</h4>
                          <button 
                            onClick={() => {
                              const newName = window.prompt("Enter new group name:", selectedConvName);
                              if (newName && newName.trim() !== "" && newName !== selectedConvName) {
                                messageApi.renameGroup(selectedConv.conversationId, newName)
                                  .then(() => {
                                    toast.success("Group renamed");
                                    fetchConversations();
                                  })
                                  .catch(() => toast.error("Failed to rename group"));
                              }
                            }}
                            className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-primary hover:border-primary transition-colors shadow-sm ml-1"
                            title="Rename group"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <h4 className="text-lg font-bold text-gray-900 text-center truncate">{selectedConvName}</h4>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{isGroup ? `Group · ${groupMembers.length} member${groupMembers.length !== 1 ? 's' : ''}` : selectedConv.conversationType || 'Direct message'}</p>
                  </div>

                  {/* Media */}
                  {mediaMessages.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <HiOutlinePhotograph className="w-4 h-4" /> Media &amp; Files
                      </h5>
                      <div className="grid grid-cols-3 gap-1.5">
                        {mediaMessages.slice(0, 9).map((m) => {
                          const atts = parseAttachments(m.attachments).filter((a) => (a.type || '').startsWith('image/'));
                          return atts.map((att, j) => (
                            <a key={`${m.id}-${j}`} href={attachmentUrl(att.url)} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img src={attachmentUrl(att.url)} alt="" className="w-full h-full object-cover" />
                            </a>
                          ));
                        })}
                      </div>
                      {mediaMessages.length > 9 && <p className="text-xs text-primary mt-2 font-medium">+{mediaMessages.length - 9} more</p>}
                    </div>
                  )}

                  {/* Members */}
                  {isGroup && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                          <HiOutlineUserGroup className="w-4 h-4" /> {groupMembers.length} Members
                        </h5>
                        <button onClick={() => { setShowAddMember(true); fetchAllUsers(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-primary" title="Add member"><HiOutlineUserAdd className="w-4 h-4" /></button>
                      </div>

                      {showAddMember && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-700">Add Member</p>
                            <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="w-4 h-4" /></button>
                          </div>
                          <input type="text" value={addMemberSearch} onChange={(e) => setAddMemberSearch(e.target.value)} placeholder="Search users..." className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm mb-2" />
                          <ul className="max-h-32 overflow-y-auto space-y-1">
                            {filteredAddable.length === 0 ? (
                              <li className="text-xs text-gray-400 text-center py-2">No users found</li>
                            ) : (
                              filteredAddable.slice(0, 10).map((u) => (
                                <li key={u.id}>
                                  <button onClick={() => handleAddMember(u.id)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white text-left transition-colors">
                                    <Avatar name={u.fullName} src={resolveAvatarSrc(u.avatarUrl)} size="sm" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-gray-900 truncate">{u.fullName}</p>
                                      <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                                    </div>
                                    <HiOutlineUserAdd className="w-4 h-4 text-primary flex-shrink-0" />
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      )}

                      {loadingMembers ? (
                        <div className="flex justify-center py-6"><Spinner size="sm" /></div>
                      ) : (
                        <ul className="space-y-1">
                          {groupMembers.map((m) => {
                            const isCurrentUser = m.id === user?.id;
                            return (
                              <li key={m.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                <Avatar name={m.fullName || m.email} src={resolveAvatarSrc(m.avatarUrl)} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{m.fullName || m.email}{isCurrentUser ? ' (You)' : ''}</p>
                                  {m.role && <p className="text-[10px] text-gray-400 capitalize">{m.role.replace('_', ' ').toLowerCase()}</p>}
                                </div>
                                {!isCurrentUser && (
                                  <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Remove member">
                                    <HiOutlineUserRemove className="w-4 h-4" />
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
