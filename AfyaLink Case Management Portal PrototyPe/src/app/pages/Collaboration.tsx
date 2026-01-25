import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  Search,
  Plus,
  Check,
  CheckCheck,
  Users,
  Bell,
  Pin,
  FileText,
  Image,
  File,
  X,
  Hash,
  AtSign,
  ChevronDown,
  Archive,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

// Mock current user
const currentUser = {
  id: "user-1",
  name: "Jean Uwase",
  role: "Social Worker",
  avatar: "JU",
};

// Mock data
const initialConversations = [
  {
    id: "conv-1",
    type: "direct",
    title: "Grace Ishimwe",
    participants: ["Grace Ishimwe", "Jean Uwase"],
    avatar: "GI",
    online: true,
    lastMessage: "Please review the case file for John Mukiza",
    lastMessageTime: "2m ago",
    unreadCount: 2,
    isPinned: false,
    caseId: "CASE-001",
    messages: [
      {
        id: "msg-1",
        senderId: "user-2",
        senderName: "Grace Ishimwe",
        senderAvatar: "GI",
        content:
          "Hi Jean, how is the follow-up for John Mukiza going?",
        timestamp: "10:30 AM",
        status: "read",
        type: "text",
        mentions: [],
        attachments: [],
      },
      {
        id: "msg-2",
        senderId: "user-1",
        senderName: "Jean Uwase",
        senderAvatar: "JU",
        content:
          "The family is doing better. I completed a home visit yesterday.",
        timestamp: "10:32 AM",
        status: "read",
        type: "text",
        mentions: [],
        attachments: [],
      },
      {
        id: "msg-3",
        senderId: "user-2",
        senderName: "Grace Ishimwe",
        senderAvatar: "GI",
        content:
          "Great! Can you share the visit report when ready?",
        timestamp: "10:35 AM",
        status: "read",
        type: "text",
        mentions: [],
        attachments: [],
      },
      {
        id: "msg-4",
        senderId: "user-1",
        senderName: "Jean Uwase",
        senderAvatar: "JU",
        content: "Here is the home visit report from yesterday",
        timestamp: "11:00 AM",
        status: "read",
        type: "file",
        mentions: [],
        attachments: [
          {
            name: "Home_Visit_Report_Jan22.pdf",
            size: "245 KB",
            type: "pdf",
          },
        ],
      },
      {
        id: "msg-5",
        senderId: "user-2",
        senderName: "Grace Ishimwe",
        senderAvatar: "GI",
        content: "Please review the case file for John Mukiza",
        timestamp: "2m ago",
        status: "delivered",
        type: "text",
        mentions: ["@Jean Uwase"],
        attachments: [],
      },
    ],
  },
  {
    id: "conv-2",
    type: "case",
    title: "Case: John Mukiza",
    participants: [
      "Grace Ishimwe",
      "Jean Uwase",
      "Marie Mukamana",
    ],
    avatar: "#",
    online: false,
    lastMessage: "Updated medical records attached",
    lastMessageTime: "1h ago",
    unreadCount: 0,
    isPinned: true,
    caseId: "CASE-001",
    messages: [
      {
        id: "msg-6",
        senderId: "user-3",
        senderName: "Marie Mukamana",
        senderAvatar: "MM",
        content:
          "I completed the medical assessment today. @Grace Ishimwe please review.",
        timestamp: "9:00 AM",
        status: "read",
        type: "text",
        mentions: ["@Grace Ishimwe"],
        attachments: [],
      },
      {
        id: "msg-7",
        senderId: "user-3",
        senderName: "Marie Mukamana",
        senderAvatar: "MM",
        content: "Updated medical records attached",
        timestamp: "1h ago",
        status: "read",
        type: "file",
        mentions: [],
        attachments: [
          {
            name: "Medical_Assessment_Jan2025.pdf",
            size: "1.2 MB",
            type: "pdf",
          },
        ],
      },
    ],
  },
  {
    id: "conv-3",
    type: "team",
    title: "Team Announcements",
    participants: ["All Staff"],
    avatar: "TA",
    online: false,
    lastMessage: "Monthly team meeting scheduled for Friday",
    lastMessageTime: "3h ago",
    unreadCount: 1,
    isPinned: true,
    messages: [
      {
        id: "msg-8",
        senderId: "admin",
        senderName: "Admin",
        senderAvatar: "AD",
        content:
          "Monthly team meeting scheduled for Friday at 2 PM. Please confirm attendance.",
        timestamp: "3h ago",
        status: "read",
        type: "announcement",
        mentions: [],
        attachments: [],
      },
    ],
  },
  {
    id: "conv-4",
    type: "group",
    title: "Social Workers Team",
    participants: [
      "Jean Uwase",
      "Marie Mukamana",
      "Alice Mutoni",
    ],
    avatar: "SW",
    online: false,
    lastMessage: "Thanks for sharing the resource!",
    lastMessageTime: "5h ago",
    unreadCount: 0,
    isPinned: false,
    messages: [
      {
        id: "msg-9",
        senderId: "user-1",
        senderName: "Jean Uwase",
        senderAvatar: "JU",
        content:
          "Found this helpful guide on family counseling techniques",
        timestamp: "6h ago",
        status: "read",
        type: "file",
        mentions: [],
        attachments: [
          {
            name: "Counseling_Best_Practices.pdf",
            size: "890 KB",
            type: "pdf",
          },
        ],
      },
      {
        id: "msg-10",
        senderId: "user-4",
        senderName: "Alice Mutoni",
        senderAvatar: "AM",
        content: "Thanks for sharing the resource!",
        timestamp: "5h ago",
        status: "read",
        type: "text",
        mentions: [],
        attachments: [],
      },
    ],
  },
];

const teamMembers = [
  {
    id: "user-1",
    name: "Jean Uwase",
    role: "Social Worker",
    avatar: "JU",
    online: true,
  },
  {
    id: "user-2",
    name: "Grace Ishimwe",
    role: "Supervisor",
    avatar: "GI",
    online: true,
  },
  {
    id: "user-3",
    name: "Marie Mukamana",
    role: "Social Worker",
    avatar: "MM",
    online: false,
  },
  {
    id: "user-4",
    name: "Alice Mutoni",
    role: "Social Worker",
    avatar: "AM",
    online: true,
  },
  {
    id: "user-5",
    name: "Dr. Patrick Niyonzima",
    role: "Medical Officer",
    avatar: "PN",
    online: false,
  },
];

export default function Collaboration() {
  const [conversations, setConversations] = useState(
    initialConversations,
  );
  const [selectedConvId, setSelectedConvId] =
    useState("conv-1");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showNewConversation, setShowNewConversation] =
    useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const messageEndRef = useRef(null);

  const selectedConv = conversations.find(
    (c) => c.id === selectedConvId,
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [selectedConv?.messages]);

  const filteredConversations = conversations.filter((conv) => {
    if (selectedTab === "pinned") return conv.isPinned;
    if (selectedTab === "cases") return conv.type === "case";
    if (selectedTab === "teams")
      return conv.type === "team" || conv.type === "group";

    if (!searchTerm) return true;
    return (
      conv.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      conv.lastMessage
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() && attachments.length === 0)
      return;

    const mentions = messageInput.match(/@\w+\s\w+/g) || [];
    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sending",
      type: attachments.length > 0 ? "file" : "text",
      mentions: mentions,
      attachments: attachments,
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === selectedConvId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage:
              messageInput ||
              `Sent ${attachments.length} file(s)`,
            lastMessageTime: "Just now",
          };
        }
        return conv;
      }),
    );

    setMessageInput("");
    setAttachments([]);

    // Simulate status updates
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === selectedConvId) {
            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === newMessage.id
                  ? { ...msg, status: "sent" }
                  : msg,
              ),
            };
          }
          return conv;
        }),
      );

      setTimeout(() => {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === selectedConvId) {
              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === newMessage.id
                    ? { ...msg, status: "read" }
                    : msg,
                ),
              };
            }
            return conv;
          }),
        );
      }, 1000);
    }, 500);
  };

  const handleAttachment = () => {
    // Mock file attachment
    const mockFile = {
      name: "Document_" + Date.now() + ".pdf",
      size: Math.floor(Math.random() * 1000) + " KB",
      type: "pdf",
    };
    setAttachments([...attachments, mockFile]);
  };

  const handleMention = (member) => {
    const newText = messageInput.replace(
      /@\w*$/,
      `@${member.name} `,
    );
    setMessageInput(newText);
    setShowMentions(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageInput(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@");
    if (
      lastAtIndex !== -1 &&
      lastAtIndex === value.length - 1
    ) {
      setShowMentions(true);
      setMentionSearch("");
    } else if (lastAtIndex !== -1) {
      const searchText = value.substring(lastAtIndex + 1);
      if (!searchText.includes(" ")) {
        setShowMentions(true);
        setMentionSearch(searchText);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const filteredMembers = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(mentionSearch.toLowerCase()),
  );

  const togglePin = (convId) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === convId
          ? { ...conv, isPinned: !conv.isPinned }
          : conv,
      ),
    );
  };

  const getStatusIcon = (status) => {
    if (status === "sending")
      return <Check className="h-3 w-3 text-gray-400" />;
    if (status === "sent")
      return <CheckCheck className="h-3 w-3 text-gray-400" />;
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  };

  const getConversationIcon = (type) => {
    switch (type) {
      case "case":
        return <Hash className="h-4 w-4" />;
      case "team":
        return <Bell className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Collaboration & Communication
          </h1>
          <p className="text-gray-600 mt-1">
            Team messaging, case discussions, and knowledge
            sharing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Team Directory
          </Button>
          <Button
            onClick={() => setShowNewConversation(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Active Chats
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {conversations.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Team Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Hash className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Case Discussions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    conversations.filter(
                      (c) => c.type === "case",
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Shared Files
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {conversations.reduce(
                    (acc, conv) =>
                      acc +
                      conv.messages.filter(
                        (m) => m.attachments.length > 0,
                      ).length,
                    0,
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <Card className="h-[600px] flex">
        {/* Left Sidebar - Conversations List */}
        <div className="w-80 border-r flex flex-col">
          {/* Search and Tabs */}
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="pinned" className="text-xs">
                  Pinned
                </TabsTrigger>
                <TabsTrigger value="cases" className="text-xs">
                  Cases
                </TabsTrigger>
                <TabsTrigger value="teams" className="text-xs">
                  Teams
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No conversations found
              </div>
            )}
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  conv.id === selectedConvId
                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        className={`${
                          conv.type === "case"
                            ? "bg-purple-100 text-purple-700"
                            : conv.type === "team"
                              ? "bg-orange-100 text-orange-700"
                              : conv.type === "group"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {conv.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {conv.online && conv.type === "direct" && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getConversationIcon(conv.type)}
                        <p className="font-medium text-sm truncate">
                          {conv.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {conv.isPinned && (
                          <Pin className="h-3 w-3 text-blue-600" />
                        )}
                        {conv.unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="h-5 min-w-5 flex items-center justify-center text-xs"
                          >
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-1">
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {conv.lastMessageTime}
                      </p>
                      {conv.type === "case" && conv.caseId && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {conv.caseId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">
                  Select a conversation
                </p>
                <p className="text-sm">
                  Choose a conversation from the list to start
                  messaging
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className={`${
                        selectedConv.type === "case"
                          ? "bg-purple-100 text-purple-700"
                          : selectedConv.type === "team"
                            ? "bg-orange-100 text-orange-700"
                            : selectedConv.type === "group"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {selectedConv.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {selectedConv.title}
                      </h3>
                      {selectedConv.type === "case" && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {selectedConv.caseId}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedConv.type === "direct" &&
                        selectedConv.online &&
                        "Online"}
                      {selectedConv.type === "case" &&
                        "Case Discussion Thread"}
                      {selectedConv.type === "team" &&
                        "Team Announcements"}
                      {selectedConv.type === "group" &&
                        `${selectedConv.participants.length} participants`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePin(selectedConv.id)}
                  >
                    <Pin
                      className={`h-4 w-4 ${selectedConv.isPinned ? "text-blue-600 fill-blue-600" : ""}`}
                    />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {selectedConv.messages.map((msg, idx) => {
                  const isOwnMessage =
                    msg.senderId === currentUser.id;
                  const showAvatar =
                    !isOwnMessage &&
                    (idx === 0 ||
                      selectedConv.messages[idx - 1]
                        .senderId !== msg.senderId);

                  if (msg.type === "announcement") {
                    return (
                      <div
                        key={msg.id}
                        className="flex justify-center"
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 max-w-2xl">
                          <div className="flex items-start gap-2">
                            <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-blue-900 mb-1">
                                Team Announcement
                              </p>
                              <p className="text-sm text-blue-800">
                                {msg.content}
                              </p>
                              <p className="text-xs text-blue-600 mt-2">
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!isOwnMessage && (
                        <Avatar
                          className={`h-8 w-8 ${showAvatar ? "" : "invisible"}`}
                        >
                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                            {msg.senderAvatar}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-md`}
                      >
                        {!isOwnMessage && showAvatar && (
                          <p className="text-xs font-medium text-gray-700 mb-1 px-1">
                            {msg.senderName}
                          </p>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-900 border border-gray-200"
                          }`}
                        >
                          {msg.mentions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {msg.mentions.map(
                                (mention, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <AtSign className="h-3 w-3 mr-1" />
                                    {mention.replace("@", "")}
                                  </Badge>
                                ),
                              )}
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          {msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map(
                                (file, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-center gap-2 p-2 rounded border ${
                                      isOwnMessage
                                        ? "bg-blue-700 border-blue-500"
                                        : "bg-gray-50 border-gray-300"
                                    }`}
                                  >
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">
                                        {file.name}
                                      </p>
                                      <p
                                        className={`text-xs ${isOwnMessage ? "text-blue-200" : "text-gray-500"}`}
                                      >
                                        {file.size}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={
                                        isOwnMessage
                                          ? "secondary"
                                          : "ghost"
                                      }
                                      className="h-6 px-2"
                                    >
                                      Download
                                    </Button>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 px-1 ${
                            isOwnMessage
                              ? "flex-row-reverse"
                              : "flex-row"
                          }`}
                        >
                          <p className="text-xs text-gray-500">
                            {msg.timestamp}
                          </p>
                          {isOwnMessage &&
                            getStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                {attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-gray-100 rounded px-3 py-2 text-sm"
                      >
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="text-xs font-medium">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {file.size}
                        </span>
                        <button
                          onClick={() =>
                            setAttachments(
                              attachments.filter(
                                (_, i) => i !== idx,
                              ),
                            )
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showMentions && (
                  <div className="mb-2 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-600 border-b">
                      Mention someone
                    </p>
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleMention(member)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.role}
                          </p>
                        </div>
                        {member.online && (
                          <span className="h-2 w-2 bg-green-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message... Use @ to mention someone"
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAttachment}
                      >
                        <Paperclip className="h-4 w-4 mr-1" />
                        Attach
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                      >
                        <Smile className="h-4 w-4 mr-1" />
                        Emoji
                      </Button>
                      <div className="flex-1" />
                      <p className="text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new
                        line
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      !messageInput.trim() &&
                      attachments.length === 0
                    }
                    className="h-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Start New Conversation</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewConversation(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversation Type
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">
                      Direct Message
                    </SelectItem>
                    <SelectItem value="case">
                      Case Discussion
                    </SelectItem>
                    <SelectItem value="group">
                      Group Chat
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Participants
                </label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {teamMembers
                    .filter((m) => m.id !== currentUser.id)
                    .map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="rounded"
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.role}
                          </p>
                        </div>
                        {member.online && (
                          <span className="h-2 w-2 bg-green-500 rounded-full" />
                        )}
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNewConversation(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowNewConversation(false)}
                >
                  Create Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}