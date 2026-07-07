const fs = require('fs')
const f = 'frontend-next/src/app/invoices/page.tsx'
let c = fs.readFileSync(f, 'utf8')

// 1. Add deletingId state
c = c.replace(
  "const [sendingLinkId, setSendingLinkId] = useState<string | null>(null)",
  "const [sendingLinkId, setSendingLinkId] = useState<string | null>(null)\n  const [deletingId, setDeletingId] = useState<string | null>(null)"
)

// 2. Add delete handler after handleCopyLink
c = c.replace(
  "const handleCopyLink = (url: string) => {",
  "const handleDelete = async (inv: Invoice) => {\n    if (!confirm('Delete invoice #' + inv.invoiceNumber + ' for ' + inv.clientName + '? This cannot be undone.')) return\n    setDeletingId(inv.id)\n    try {\n      const token = getNmdToken()\n      const res = await fetch(API + '/api/invoices/' + inv.id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })\n      if (!res.ok) throw new Error('Failed')\n      setInvoices(p => p.filter(i => i.id !== inv.id))\n    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete') }\n    setDeletingId(null)\n  }\n\n  const handleCopyLink = (url: string) => {"
)

// 3. Add delete button after the linkError div
c = c.replace(
  "              {linkError?.id === inv.id && (\n                <div style={{ fontSize: '0.7rem', color: '#B91C1C' }}>{linkError.message}</div>\n              )}\n            </div>",
  "              {linkError?.id === inv.id && (\n                <div style={{ fontSize: '0.7rem', color: '#B91C1C' }}>{linkError.message}</div>\n              )}\n              <button onClick={() => handleDelete(inv)} disabled={deletingId === inv.id} style={{ padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{deletingId === inv.id ? 'Deleting...' : 'Delete'}</button>\n            </div>"
)

fs.writeFileSync(f, c, 'utf8')
console.log('Done - delete button added to invoices')
