const fs = require('fs')
const path = require('path')
const ROOT = 'C:/Dev/NMD-App'

let jobs = fs.readFileSync(path.join(ROOT, 'backend/src/routes/jobs.ts'), 'utf8')

// Normalise to LF for matching, we'll write back as-is
const jobsLF = jobs.replace(/\r\n/g, '\n')

// 1. Add email import (if not already there)
if (!jobsLF.includes('services/email.js')) {
  jobs = jobs.replace(
    'import { sendPushToUser } from "../services/push.js";',
    'import { sendPushToUser } from "../services/push.js";\nimport { buildNmdEmailTemplate, sendEmail } from "../services/email.js";'
  )
  console.log('import added')
} else {
  console.log('import already present, skipping')
}

// Re-read normalised after potential import change
const jobsLF2 = jobs.replace(/\r\n/g, '\n')

// 2. Add completion email - search on normalised content, patch original
const NEEDLE = '      return res.json({ job: updated.rows[0] });\n    } catch (err) {\n      await client.query("ROLLBACK");'

if (!jobsLF2.includes(NEEDLE)) {
  console.error('ERROR: return target not found in jobs.ts')
  console.error('File line endings:', jobs.includes('\r\n') ? 'CRLF' : 'LF')
  // Print the area around "return res.json({ job:" to help debug
  const idx = jobsLF2.indexOf('return res.json({ job: updated')
  if (idx >= 0) {
    console.error('Found "return res.json({ job:" at index', idx)
    console.error('Surrounding text (hex):', Buffer.from(jobsLF2.slice(idx - 10, idx + 80)).toString('hex'))
  }
  process.exit(1)
}

const REPLACEMENT = [
  '      // Send payment email when job is marked completed',
  "      if (status === 'completed') {",
  '        try {',
  '          const invResult = await pool.query(',
  '            `SELECT invoice_number, client_name, client_id, job_name, total, payment_link_url',
  '               FROM invoices',
  "               WHERE job_id = $1 AND status = 'unpaid' AND payment_link_url IS NOT NULL",
  '               LIMIT 1`,',
  '            [jobId]',
  '          );',
  '          if (invResult.rows.length > 0) {',
  '            const inv = invResult.rows[0];',
  '            const clientEmailResult = await pool.query(',
  "              `SELECT email FROM clients WHERE id = $1 OR LOWER(CONCAT(first_name,' ',last_name)) = LOWER($2) LIMIT 1`,",
  "              [inv.client_id || 'none', inv.client_name]",
  '            );',
  '            const clientEmail = clientEmailResult.rows[0]?.email;',
  '            if (clientEmail) {',
  '              await sendEmail({',
  '                to: clientEmail,',
  '                subject: `Your service is complete - Invoice #${inv.invoice_number} | NMD Pressure Washing`,',
  '                html: buildNmdEmailTemplate({',
  "                  title: 'Service Complete',",
  "                  heading: 'Your Service is Complete!',",
  '                  message: `Hi ${inv.client_name},\\n\\nGreat news - your ${inv.job_name} service has been completed.\\n\\nInvoice #${inv.invoice_number}\\nTotal Due: $${Number(inv.total).toFixed(2)}\\n\\nClick below to pay securely online.`,',
  "                  buttonText: 'Pay Invoice Now',",
  '                  buttonUrl: inv.payment_link_url,',
  "                  footerNote: 'Clean Results. Reliable Service. Every Time.'",
  '                }),',
  '                text: `Your NMD ${inv.job_name} service is complete. Invoice #${inv.invoice_number}. Total: $${Number(inv.total).toFixed(2)}. Pay here: ${inv.payment_link_url}`',
  '              });',
  '            }',
  '          }',
  '        } catch (emailErr) {',
  "          console.error('Job completion email error:', emailErr);",
  '        }',
  '      }',
  '',
  '      return res.json({ job: updated.rows[0] });',
  '    } catch (err) {',
  '      await client.query("ROLLBACK");',
].join('\n')

// Apply patch on LF-normalised content then write back
const patched = jobsLF2.replace(NEEDLE, REPLACEMENT)
// Restore CRLF if original had it
const final = jobs.includes('\r\n') ? patched.replace(/\n/g, '\r\n') : patched
fs.writeFileSync(path.join(ROOT, 'backend/src/routes/jobs.ts'), final, 'utf8')
console.log('jobs.ts patched successfully')
