const fs = require('fs')
const path = require('path')
const ROOT = 'C:/Dev/NMD-App'

// ── PATCH invoices.ts ────────────────────────────────────────────────────────
let inv = fs.readFileSync(path.join(ROOT, 'backend/src/routes/invoices.ts'), 'utf8')

const OLD_INV = [
  '    return res.json({ invoice: mapInvoice(result.rows[0]) });',
  '  } catch (error) {',
  '    console.error("invoice update error", error);',
].join('\n')

const NEW_INV = [
  '    const invoice = mapInvoice(result.rows[0]);',
  '',
  '    // Notify client with payment link when invoice is updated',
  "    if (invoice.paymentLinkUrl && invoice.status === 'unpaid') {",
  '      try {',
  '        const clientEmailResult = await pool.query(',
  "          `SELECT email FROM clients WHERE id = $1 OR LOWER(CONCAT(first_name,' ',last_name)) = LOWER($2) LIMIT 1`,",
  "          [invoice.clientId || 'none', invoice.clientName]",
  '        );',
  '        const clientEmail = clientEmailResult.rows[0]?.email;',
  '        if (clientEmail) {',
  '          await sendEmail({',
  '            to: clientEmail,',
  '            subject: `Invoice #${invoice.invoiceNumber} - Payment Due | NMD Pressure Washing`,',
  '            html: buildNmdEmailTemplate({',
  '              title: `Invoice #${invoice.invoiceNumber}`,',
  "              heading: 'Invoice Ready for Payment',",
  '              message: `Hi ${invoice.clientName},\\n\\nYour invoice for ${invoice.jobName} has been updated.\\n\\nTotal Due: $${invoice.total.toFixed(2)}\\n\\nClick the button below to pay securely online.`,',
  "              buttonText: 'Pay Invoice Now',",
  '              buttonUrl: invoice.paymentLinkUrl,',
  "              footerNote: 'Clean Results. Reliable Service. Every Time.'",
  '            }),',
  '            text: `Invoice #${invoice.invoiceNumber} for ${invoice.jobName}. Total: $${invoice.total.toFixed(2)}. Pay here: ${invoice.paymentLinkUrl}`',
  '          });',
  '        }',
  '      } catch (emailErr) {',
  "        console.error('Invoice update email error:', emailErr);",
  '      }',
  '    }',
  '',
  '    return res.json({ invoice });',
  '  } catch (error) {',
  '    console.error("invoice update error", error);',
].join('\n')

if (!inv.includes(OLD_INV)) {
  console.error('ERROR: patch target not found in invoices.ts')
  console.error('Looking for:\n' + OLD_INV)
  process.exit(1)
}
inv = inv.replace(OLD_INV, NEW_INV)
fs.writeFileSync(path.join(ROOT, 'backend/src/routes/invoices.ts'), inv, 'utf8')
console.log('invoices.ts patched')

// ── PATCH jobs.ts ────────────────────────────────────────────────────────────
let jobs = fs.readFileSync(path.join(ROOT, 'backend/src/routes/jobs.ts'), 'utf8')

// 1. Add email import
const OLD_IMPORT = 'import { sendPushToUser } from "../services/push.js";'
const NEW_IMPORT = [
  'import { sendPushToUser } from "../services/push.js";',
  'import { buildNmdEmailTemplate, sendEmail } from "../services/email.js";',
].join('\n')

if (!jobs.includes(OLD_IMPORT)) {
  console.error('ERROR: import not found in jobs.ts')
  process.exit(1)
}
jobs = jobs.replace(OLD_IMPORT, NEW_IMPORT)

// 2. Add completion email before return
const OLD_RETURN = [
  '      return res.json({ job: updated.rows[0] });',
  '    } catch (err) {',
  '      await client.query("ROLLBACK");',
].join('\n')

const NEW_RETURN = [
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

if (!jobs.includes(OLD_RETURN)) {
  console.error('ERROR: return target not found in jobs.ts')
  process.exit(1)
}
jobs = jobs.replace(OLD_RETURN, NEW_RETURN)
fs.writeFileSync(path.join(ROOT, 'backend/src/routes/jobs.ts'), jobs, 'utf8')
console.log('jobs.ts patched')
console.log('All done')
