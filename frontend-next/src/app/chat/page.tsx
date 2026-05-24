"use client"
import { useEffect, useState, useRef } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Message = {
  id: string
  body: string
  sender_id: string
  sender_display_name: string
  sender_role: string
  image_url?: string
  created_at: string
}

type Conversation = {
  id: string
  is_group: boolean
  group_name?: string
  members: { id: string; displayName: string; role: string }[]
  last_message: string
  created_at: string
}

type User = { id: string; displayName: string; email: string; role: string }

const ROLE_COLORS: Record<string, string> = {
  superadmin: '#7c3aed',
  admin: '#124d83',
  employee: '#1f6132',
  client: '#b45309',
}

export default function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    try {
      const payload = JSON.parse(atob(token!.split('.')[1]))
      setCurrentUserId(payload.id || payload.sub || null)
    } catch {}

    fetch(`${API}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setConversations(d.conversations || []); setLoading(false) })
      .catch(() => { setError("Could not load conversations."); setLoading(false) })

    fetch(`${API}/api/chat/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeConv) return
    const token = getNmdToken()
    fetch(`${API}/api/chat/conversations/${activeConv}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => {})
  }, [activeConv])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = async (imageUrl?: string) => {
    if (!newMsg.trim() && !imageUrl) return
    if (!activeConv) return
    setSending(true)
    const token = getNmdToken()
    try {
      const r = await fetch(`${API}/api/chat/conversations/${activeConv}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMsg.trim(), imageUrl })
      })
      const data = await r.json()
      if (data.message) {
        setMessages(prev => [...prev, {
          id: data.message.id,
          body: data.message.body || "",
          sender_id: data.message.sender_id,
          sender_display_name: data.message.sender_display_name || "You",
          sender_role: data.message.sender_role || "",
          image_url: data.message.image_url,
          created_at: data.message.created_at,
        }])
      }
      setNewMsg("")
    } catch {}
    setSending(false)
  }

  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      sendMessage(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const startNewChat = async (userId: string) => {
    const token = getNmdToken()
    try {
      const r = await fetch(`${API}/api/chat/conversations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId })
      })
      const data = await r.json()
      setActiveConv(data.conversationId)
      setShowNewChat(false)
      fetch(`${API}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setConversations(d.conversations || []))
    } catch {}
  }

  const getConvLabel = (c: Conversation) => {
    if (c.is_group) return c.group_name || "Group"
    return c.members.map(m => m.displayName).join(", ") || "Conversation"
  }

  return (
    <PortalShell requiredRole={["admin", "superadmin"]}>
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Admin Portal</div>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Chat</h1>
          <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Team communication and client messaging.</p>
        </div>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          style={{ padding: "0.6rem 1.1rem", borderRadius: 8, background: "linear-gradient(135deg, #1f6132, #124d83)", color: "white", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "DM Sans, sans-serif", marginTop: 4 }}
        >
          + New Chat
        </button>
      </div>

      {showNewChat && (
        <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0e1117", marginBottom: "0.75rem" }}>Start a new conversation with:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => startNewChat(u.id)}
                style={{ padding: "0.4rem 0.9rem", borderRadius: 20, border: "1.5px solid #dde4ef", background: "white", cursor: "pointer", fontSize: "0.82rem", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: ROLE_COLORS[u.role] || "#8494b0", display: "inline-block" }} />
                {u.displayName}
                <span style={{ fontSize: "0.7rem", color: "#8494b0" }}>({u.role})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1rem", height: "65vh" }}>
          <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, overflow: "auto" }}>
            {conversations.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "#8494b0", fontSize: "0.85rem" }}>No conversations yet.</div>
            )}
            {conversations.map(c => (
              <div
                key={c.id}
                onClick={() => setActiveConv(c.id)}
                style={{ padding: "0.85rem 1rem", cursor: "pointer", borderBottom: "1px solid #f0f3f9", background: activeConv === c.id ? "#eaf7ef" : "white", borderLeft: activeConv === c.id ? "3px solid #1f6132" : "3px solid transparent" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  {c.is_group && <span style={{ fontSize: "0.65rem", background: "#1f6132", color: "white", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>GROUP</span>}
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0e1117" }}>{getConvLabel(c)}</div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#8494b0" }}>{c.last_message || "No messages yet"}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, display: "flex", flexDirection: "column" }}>
            {!activeConv ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8494b0", fontSize: "0.875rem" }}>
                Select a conversation to start chatting.
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
                  {messages.map(m => {
                    const isOwn = m.sender_id === currentUserId
                    return (
                      <div key={m.id} style={{ maxWidth: "70%", alignSelf: isOwn ? "flex-end" : "flex-start" }}>
                        {!isOwn && (
                          <div style={{ fontSize: "0.7rem", color: ROLE_COLORS[m.sender_role] || "#8494b0", marginBottom: 2, fontWeight: 600 }}>
                            {m.sender_display_name} · {m.sender_role}
                          </div>
                        )}
                        {m.image_url && (
                          <img src={m.image_url} alt="attachment" style={{ maxWidth: "100%", borderRadius: 10, marginBottom: m.body ? 4 : 0 }} />
                        )}
                        {m.body && (
                          <div style={{ background: isOwn ? "linear-gradient(135deg, #1f6132, #124d83)" : "#f4f7fb", borderRadius: 10, padding: "0.5rem 0.85rem", fontSize: "0.875rem", color: isOwn ? "white" : "#0e1117" }}>
                            {m.body}
                          </div>
                        )}
                        <div style={{ fontSize: "0.65rem", color: "#b0bcd0", marginTop: 2, textAlign: isOwn ? "right" : "left" }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div style={{ padding: "0.85rem", borderTop: "1px solid #dde4ef", display: "flex", gap: 8, alignItems: "center" }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageUpload(e.target.files)} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{ padding: "0.55rem 0.75rem", borderRadius: 8, border: "1.5px solid #dde4ef", background: "white", cursor: "pointer", fontSize: "1rem" }}
                    title="Send image"
                  >
                    📷
                  </button>
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: "0.55rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none" }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={sending}
                    style={{ padding: "0.55rem 1.25rem", borderRadius: 8, background: "linear-gradient(135deg, #1f6132, #124d83)", color: "white", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  )
}