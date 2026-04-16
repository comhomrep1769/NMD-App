import React from "react";
import { apiFetch } from "../api";
import type { AuthUser, ChatMessage, ChatUser, Conversation } from "../types";

export default function ChatPage({ currentUser }: { currentUser: AuthUser }) {
  const [users, setUsers] = React.useState<ChatUser[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [messageBody, setMessageBody] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadConversations = React.useCallback(async () => {
    const [usersData, conversationsData] = await Promise.all([
      apiFetch<{ users: ChatUser[] }>("/api/chat/users"),
      apiFetch<{ conversations: Conversation[] }>("/api/chat/conversations")
    ]);

    setUsers(usersData.users);
    setConversations(conversationsData.conversations);

    if (!selectedConversationId && conversationsData.conversations.length > 0) {
      setSelectedConversationId(conversationsData.conversations[0].id);
    }
  }, [selectedConversationId]);

  const loadMessages = React.useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const data = await apiFetch<{ messages: ChatMessage[] }>(
        `/api/chat/conversations/${conversationId}/messages`
      );
      setMessages(data.messages);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    setError("");

    loadConversations()
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load chat"))
      .finally(() => setLoading(false));
  }, [loadConversations]);

  React.useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId).catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load messages")
    );
  }, [selectedConversationId, loadMessages]);

  React.useEffect(() => {
    if (!selectedConversationId) return;

    const interval = setInterval(() => {
      loadConversations().catch(() => undefined);
      loadMessages(selectedConversationId).catch(() => undefined);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversationId, loadConversations, loadMessages]);

  const createConversation = async (targetUserId: string) => {
    try {
      const data = await apiFetch<{ conversationId: string }>("/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ targetUserId })
      });

      await loadConversations();
      setSelectedConversationId(data.conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId || !messageBody.trim()) return;

    try {
      await apiFetch(`/api/chat/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: messageBody })
      });

      setMessageBody("");
      await loadMessages(selectedConversationId);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2 className="panelTitle">Chat</h2>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {loading ? (
        <div className="listCard">Loading chat...</div>
      ) : (
        <div className="chatLayout">
          <div className="chatSidebar">
            <div className="chatSidebarSection">
              <div className="chatSidebarTitle">Start Conversation</div>
              <div className="chatUserList">
                {users.map((user) => (
                  <button
                    key={user.id}
                    className="chatUserButton"
                    onClick={() => createConversation(user.id)}
                  >
                    <div>{user.displayName}</div>
                    <div className="chatMeta">{user.role}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="chatSidebarSection">
              <div className="chatSidebarTitle">Conversations</div>
              <div className="chatConversationList">
                {conversations.map((conversation) => {
                  const otherMembers = conversation.members.filter((m) => m.id !== currentUser.id);
                  const label =
                    otherMembers.map((m) => m.displayName).join(", ") || "Conversation";

                  return (
                    <button
                      key={conversation.id}
                      className={`chatConversationButton ${
                        selectedConversationId === conversation.id ? "chatConversationButtonActive" : ""
                      }`}
                      onClick={() => setSelectedConversationId(conversation.id)}
                    >
                      <div className="chatConversationName">{label}</div>
                      <div className="chatMeta">
                        {conversation.last_message || "No messages yet"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="chatMain">
            {!selectedConversation ? (
              <div className="listCard">Select a conversation to begin chatting.</div>
            ) : (
              <>
                <div className="chatHeader">
                  <div className="chatConversationName">
                    {selectedConversation.members
                      .filter((m) => m.id !== currentUser.id)
                      .map((m) => m.displayName)
                      .join(", ") || "Conversation"}
                  </div>
                </div>

                <div className="chatMessages">
                  {messagesLoading ? (
                    <div className="listCard">Loading messages...</div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.sender_id === currentUser.id;
                      return (
                        <div
                          key={message.id}
                          className={`chatMessage ${mine ? "chatMessageMine" : ""}`}
                        >
                          <div className="chatMessageSender">
                            {mine ? "You" : message.sender_display_name}
                          </div>
                          <div>{message.body}</div>
                          <div className="chatMeta">
                            {new Date(message.created_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="chatComposer" onSubmit={sendMessage}>
                  <textarea
                    className="textInput"
                    rows={3}
                    placeholder="Type your message..."
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                  />
                  <button className="primaryButton" type="submit">
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
