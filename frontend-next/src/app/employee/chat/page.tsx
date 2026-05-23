"use client"
import { useEffect, useState, useRef } from "react"
import PortalShell from "@/components/portal/PortalShell"
import { LoadingCard, ErrorCard } from "@/components/portal/PortalUI"
import { getNmdToken } from "@/lib/authStorage"

type Message = { id: string; body: string; senderId: string; senderName: string; createdAt: string }
type Conversation = { id: string; members: { id: string; displayName: string; role: string }[]; lastMessage: string; createdAt: string }

export default function EmployeeChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = getNmdToken()
    fetch(`${API}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setConversations(Array.isArray(d) ? d : d.conversations || []); setLoading(false) })
      .catch(() => { setError("Could not load conversations."); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!activeConv) return
    const token = getNmdToken()
    fetch(`${API}/api/chat/conversations/${activeConv}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setMessages(Array.isArray(d) ? d : d.messages || []) })
      .catch(() => {})
  }, [activeConv])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConv) return
    setSending(true)
    const token = getNmdToken()
    try {
      const r = await fetch(`${API}/api/chat/conversations/${activeConv}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMsg.trim() })
      })
      const msg = await r.json()
      setMessages(prev => [...prev, msg])
      setNewMsg("")
    } catch {}
    setSending(false)
  }

  return (
    <PortalShell requiredRole="employee">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f6132", marginBottom: 6 }}>Employee Portal</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.75rem", fontWeight: 800, color: "#0e1117", letterSpacing: "-0.03em", marginBottom: 6 }}>Chat</h1>
        <p style={{ color: "#5a6a88", fontSize: "0.875rem" }}>Communicate with your team and admin.</p>
      </div>
      {loading && <LoadingCard />}
      {error && <ErrorCard message={error} />}
      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1rem", height: "60vh" }}>
          <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, overflow: "auto" }}>
            {conversations.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#8494b0", fontSize: "0.85rem" }}>No conversations yet.</div>}
            {conversations.map(c => (
              <div key={c.id} onClick={() => setActiveConv(c.id)} style={{ padding: "0.85rem 1rem", cursor: "pointer", borderBottom: "1px solid #f0f3f9", background: activeConv === c.id ? "#eaf7ef" : "white", borderLeft: activeConv === c.id ? "3px solid #1f6132" : "3px solid transparent" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0e1117", marginBottom: 2 }}>
                  {c.members.map(m => m.displayName).join(", ") || "Conversation"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#8494b0" }}>{c.lastMessage || "No messages yet"}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "white", border: "1.5px solid #dde4ef", borderRadius: 14, display: "flex", flexDirection: "column" }}>
            {!activeConv ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8494b0", fontSize: "0.875rem" }}>Select a conversation to start chatting.</div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
                  {messages.map(m => (
                    <div key={m.id} style={{ maxWidth: "70%", alignSelf: "flex-start" }}>
                      <div style={{ fontSize: "0.7rem", color: "#8494b0", marginBottom: 2 }}>{m.senderName}</div>
                      <div style={{ background: "#f4f7fb", borderRadius: 10, padding: "0.5rem 0.85rem", fontSize: "0.875rem", color: "#0e1117" }}>{m.body}</div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div style={{ padding: "0.85rem", borderTop: "1px solid #dde4ef", display: "flex", gap: 8 }}>
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: "0.55rem 0.85rem", borderRadius: 8, border: "1.5px solid #dde4ef", fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none" }}
                  />
                  <button onClick={sendMessage} disabled={sending} style={{ padding: "0.55rem 1.25rem", borderRadius: 8, background: "linear-gradient(135deg, #1f6132, #124d83)", color: "white", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
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
