import { AppIcon } from "shared/ui/AppIcon";
import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { serviceRequest } from "@/services/service-client";
import { Skeleton } from "@/components/ui";

interface Contact {
  _id: string;
  name: string;
  role: string;
  class_name?: string;
  section?: string;
}

interface ConversationItem {
  _id: string;
  type: string;
  other_user?: { _id: string; name: string; role: string };
  last_message?: { text: string; sender_id: string; created_at: string };
  unread_count: number;
}

interface ChatMessage {
  _id: string;
  sender_id: string;
  text: string;
  attachment_url?: string;
  attachment_type?: string;
  reply_to_id?: string;
  is_seen: boolean;
  expires_in_days: number;
  created_at: string;
}

export function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkTarget, setBulkTarget] = useState<string>("all_students");
  const [bulkSending, setBulkSending] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const res = await serviceRequest<ConversationItem[]>("/api/messages/conversations");
    if (res.ok) {
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setConversations(data);
    }
    setLoading(false);
  }, []);

  // Load contacts
  const loadContacts = useCallback(async () => {
    const res = await serviceRequest<Contact[]>("/api/messages/contacts");
    if (res.ok) {
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setContacts(data);
    }
  }, []);

  useEffect(() => { loadConversations(); loadContacts(); }, []);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConv) return;
    setMsgLoading(true);
    serviceRequest<ChatMessage[]>(`/api/messages/conversations/${activeConv}/messages`).then((res) => {
      if (res.ok) {
        const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        setMessages(data);
        serviceRequest(`/api/messages/conversations/${activeConv}/seen`, { method: "POST" });
      }
      setMsgLoading(false);
    });
  }, [activeConv]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket listener
  useEffect(() => {
    const handleWsMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message_receive" && data.payload?.conversation_id === activeConv) {
          setMessages((prev) => [...prev, {
            _id: data.payload.message_id,
            sender_id: data.payload.sender_id,
            text: data.payload.text,
            is_seen: false,
            expires_in_days: 7,
            created_at: data.payload.created_at,
          }]);
        }
        if (data.type === "typing_start" && data.payload?.conversation_id === activeConv) setTyping(true);
        if (data.type === "typing_stop" && data.payload?.conversation_id === activeConv) setTyping(false);
        if (data.type === "message_receive") loadConversations();
      } catch {}
    };
    window.addEventListener("ws-message", handleWsMessage as any);
    return () => window.removeEventListener("ws-message", handleWsMessage as any);
  }, [activeConv, loadConversations]);

  // Send message
  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    const res = await serviceRequest<any>(`/api/messages/conversations/${activeConv}/messages`, {
      method: "POST",
      body: JSON.stringify({ text: input.trim() }),
    });
    if (res.ok) {
      setMessages((prev) => [...prev, {
        _id: res.data?._id || `temp_${Date.now()}`,
        sender_id: user?.id || "",
        text: input.trim(),
        is_seen: false,
        expires_in_days: 7,
        created_at: new Date().toISOString(),
      }]);
      setInput("");
      loadConversations();
    }
    setSending(false);
  }

  // Typing indicator
  function handleInputChange(value: string) {
    setInput(value);
    if (activeConv) {
      serviceRequest(`/api/messages/conversations/${activeConv}/typing`, {
        method: "POST",
        body: JSON.stringify({ is_typing: true }),
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        serviceRequest(`/api/messages/conversations/${activeConv}/typing`, {
          method: "POST",
          body: JSON.stringify({ is_typing: false }),
        });
      }, 2000);
    }
  }

  // Start new conversation
  async function startConversation(contactId: string) {
    const res = await serviceRequest<any>("/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ recipient_id: contactId }),
    });
    if (res.ok) {
      setActiveConv(res.data._id);
      loadConversations();
    }
  }

  // Bulk broadcast
  async function handleBulkSend() {
    if (!bulkMessage.trim() || bulkSending) return;
    setBulkSending(true);
    await serviceRequest("/api/messages/broadcast", {
      method: "POST",
      body: JSON.stringify({
        target_group: bulkTarget,
        message: bulkMessage.trim(),
        recipient_ids: selectedContacts.length > 0 ? selectedContacts : undefined,
      }),
    });
    setBulkMessage("");
    setSelectedContacts([]);
    setShowBulk(false);
    setBulkSending(false);
  }

  // Toggle contact selection for bulk
  function toggleContactSelect(id: string) {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const matchSearch = !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase());
    const matchRole = roleFilter === "all" || c.role === roleFilter;
    const matchClass = classFilter === "all" || c.class_name === classFilter;
    return matchSearch && matchRole && matchClass;
  });

  // Get unique classes from contacts
  const uniqueClasses = [...new Set(contacts.map((c) => c.class_name).filter(Boolean))];

  const activeConvData = conversations.find((c) => c._id === activeConv);
  const filteredConversations = conversations.filter((c) =>
    !search || c.other_user?.name.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <SchoolShell eyebrow="Communication" title="Conversations">
      <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* LEFT: Conversations Sidebar */}
        <div className="w-[300px] border-r border-slate-100 flex flex-col">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AppIcon name="chat" size={18} className="text-blue-600" />
                Chats
              </h2>
              {isAdmin && (
                <button
                  onClick={() => setShowBulk(!showBulk)}
                  className="h-7 px-2 rounded-lg bg-blue-50 text-blue-600 flex items-center gap-1 hover:bg-blue-100 transition-colors text-[10px] font-bold"
                >
                  <AppIcon name="campaign" size={14} />
                  Broadcast
                </button>
              )}
            </div>
            <div className="relative">
              <AppIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Bulk Broadcast Panel */}
          {showBulk && (
            <div className="p-3 border-b border-slate-100 bg-blue-50/50 space-y-2">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <AppIcon name="campaign" size={12} /> Bulk Broadcast
              </p>
              <select
                value={bulkTarget}
                onChange={(e) => setBulkTarget(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-blue-200 bg-white text-xs"
              >
                <option value="all_students">All Students</option>
                <option value="all_teachers">All Teachers</option>
                <option value="all">Everyone</option>
                <option value="selected">Selected Contacts</option>
              </select>
              <textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Type broadcast message..."
                className="w-full h-16 px-3 py-2 rounded-lg border border-blue-200 bg-white text-xs resize-none focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={handleBulkSend}
                disabled={!bulkMessage.trim() || bulkSending}
                className="w-full h-8 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <AppIcon name="send" size={12} />
                {bulkSending ? "Sending..." : "Send Broadcast"}
              </button>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <AppIcon name="chat" size={32} className="text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => { setActiveConv(conv._id); setTyping(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${
                    activeConv === conv._id ? "bg-blue-50 border-l-2 border-l-blue-600" : ""
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0">
                    <AppIcon name="person" size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{conv.other_user?.name || "Unknown"}</p>
                      {conv.last_message && (
                        <span className="text-[9px] text-slate-400">
                          {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[10px] text-slate-500 truncate">{conv.last_message?.text || "No messages yet"}</p>
                      {conv.unread_count > 0 && (
                        <span className="h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* MIDDLE: Chat Area */}
        <div className="flex-1 flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <AppIcon name="forum" size={28} className="text-blue-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Select a conversation</h3>
              <p className="text-[11px] text-slate-400 mt-1">Choose from sidebar or pick a contact</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <AppIcon name="person" size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{activeConvData?.other_user?.name || "Chat"}</p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {typing ? (
                      <span className="text-blue-600 font-bold">typing...</span>
                    ) : (
                      activeConvData?.other_user?.role || ""
                    )}
                  </p>
                </div>
                <button className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <AppIcon name="more_vert" size={16} className="text-slate-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50/50">
                {msgLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-48 rounded-xl" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AppIcon name="chat" size={24} className="text-slate-200 mb-2" />
                    <p className="text-[11px] text-slate-400">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] px-3 py-2 rounded-2xl ${
                          isMe
                            ? "bg-blue-600 rounded-br-md"
                            : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-md"
                        }`}>
                          <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isMe ? "text-white" : "text-slate-800"}`}>{msg.text}</p>
                          <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end" : ""}`}>
                            <span className={`text-[9px] ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isMe && msg.is_seen && (
                              <AppIcon name="check_circle" size={10} className="text-blue-200" />
                            )}
                            {isMe && !msg.is_seen && (
                              <AppIcon name="check" size={10} className="text-blue-300/50" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  >
                    <AppIcon name="send" size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* RIGHT: Contacts Sidebar */}
        <div className="w-[280px] border-l border-slate-100 flex flex-col bg-slate-50/30">
          {/* Header */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <AppIcon name="people" size={15} className="text-blue-600" />
              Contacts
            </h3>
            <div className="relative">
              <AppIcon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full h-7 pl-7 pr-2 rounded-md border border-slate-200 bg-white text-[11px] focus:outline-none focus:border-blue-400"
              />
            </div>
            {/* Filters */}
            <div className="flex gap-1.5">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex-1 h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] focus:outline-none focus:border-blue-400"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="flex-1 h-7 px-2 rounded-md border border-slate-200 bg-white text-[10px] focus:outline-none focus:border-blue-400"
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Select All for bulk */}
          {showBulk && bulkTarget === "selected" && filteredContacts.length > 0 && (
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  if (selectedContacts.length === filteredContacts.length) {
                    setSelectedContacts([]);
                  } else {
                    setSelectedContacts(filteredContacts.map((c) => c._id));
                  }
                }}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                {selectedContacts.length === filteredContacts.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-[9px] text-slate-400">{selectedContacts.length} selected</span>
            </div>
          )}

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <AppIcon name="person_off" size={20} className="text-slate-200 mb-1" />
                <p className="text-[10px] text-slate-400">No contacts found</p>
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isSelected = selectedContacts.includes(c._id);
                return (
                  <div
                    key={c._id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-50 hover:bg-white transition-colors cursor-pointer ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      if (showBulk && bulkTarget === "selected") {
                        toggleContactSelect(c._id);
                      } else {
                        startConversation(c._id);
                      }
                    }}
                  >
                    {/* Checkbox for bulk mode */}
                    {showBulk && bulkTarget === "selected" && (
                      <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300"
                      }`}>
                        {isSelected && <AppIcon name="check" size={10} className="text-white" />}
                      </div>
                    )}
                    {/* Avatar */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      c.role === "teacher" ? "bg-purple-100" : c.role === "admin" ? "bg-amber-100" : "bg-blue-100"
                    }`}>
                      <AppIcon
                        name={c.role === "teacher" ? "badge" : c.role === "admin" ? "shield" : "school"}
                        size={14}
                        className={c.role === "teacher" ? "text-purple-600" : c.role === "admin" ? "text-amber-600" : "text-blue-600"}
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-900 truncate">{c.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-medium capitalize px-1.5 py-0.5 rounded ${
                          c.role === "teacher" ? "bg-purple-50 text-purple-600" :
                          c.role === "admin" ? "bg-amber-50 text-amber-600" :
                          "bg-blue-50 text-blue-600"
                        }`}>{c.role}</span>
                        {c.class_name && (
                          <span className="text-[9px] text-slate-400">{c.class_name}{c.section ? `-${c.section}` : ""}</span>
                        )}
                      </div>
                    </div>
                    {/* Chat icon */}
                    {!(showBulk && bulkTarget === "selected") && (
                      <AppIcon name="chat" size={14} className="text-slate-300 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </SchoolShell>
  );
}
