// backend/src/services/sms.ts
// Uses TextBelt free tier — 1 free SMS/day per IP (sufficient for dev/low-volume)
// For production upgrade: get a TextBelt key at textbelt.com (~$10 = 250 SMS)
// Set env: TEXTBELT_KEY=textbelt (free) or your paid key
const TEXTBELT_KEY = process.env.TEXTBELT_KEY || 'textbelt';
const TEXTBELT_URL = 'https://textbelt.com/text';
async function sendSms(phone, message) {
    // Normalize phone: strip non-digits, ensure leading +1 for US
    const digits = phone.replace(/\D/g, '');
    const normalized = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
    try {
        const res = await fetch(TEXTBELT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: normalized,
                message,
                key: TEXTBELT_KEY,
            }),
        });
        const data = (await res.json());
        if (!data.success) {
            console.error('[SMS] Failed to send:', data.error);
        }
        return data;
    }
    catch (err) {
        console.error('[SMS] Network error:', err);
        return { success: false, error: String(err) };
    }
}
// ── Pre-built notification messages ──────────────────────────────────────────
/**
 * Sent when employee is on the way to the job site.
 */
export async function sendEmployeeOnWaySms(clientPhone, clientName, employeeName, eta) {
    const etaText = eta ? ` They should arrive in approximately ${eta}.` : '';
    const message = `Hi ${clientName}, your NMD Pressure Washing technician ` +
        `${employeeName} is on their way to your property.${etaText} ` +
        `Reply STOP to opt out of SMS updates.`;
    return sendSms(clientPhone, message);
}
/**
 * Sent when employee arrives at the job site.
 */
export async function sendEmployeeArrivedSms(clientPhone, clientName, employeeName) {
    const message = `Hi ${clientName}, your NMD technician ${employeeName} has arrived ` +
        `at your property and is getting started. ` +
        `Reply STOP to opt out of SMS updates.`;
    return sendSms(clientPhone, message);
}
/**
 * Sent when job is completed.
 */
export async function sendJobCompleteSms(clientPhone, clientName, serviceName) {
    const service = serviceName ? `your ${serviceName}` : 'your service';
    const message = `Hi ${clientName}, ${service} has been completed by NMD Pressure Washing Services. ` +
        `Please review your property and contact us if you have any questions. ` +
        `Thank you for choosing NMD! Reply STOP to opt out of SMS updates.`;
    return sendSms(clientPhone, message);
}
export default sendSms;
