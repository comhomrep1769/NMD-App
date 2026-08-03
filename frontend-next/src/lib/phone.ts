// Single source of truth for the business phone number.
// The admin-editable site.phone value may be stored raw (3218886586) or
// formatted, so display formatting happens here at render rather than
// depending on however it was typed into the admin panel.
export const PHONE_FALLBACK = '(321) 888-6586'

export function formatPhone(raw: string | undefined | null): string {
  const digits = (raw || '').replace(/\D/g, '')
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (local.length !== 10) return raw?.trim() || PHONE_FALLBACK
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`
}

export function telHref(raw: string | undefined | null): string {
  const digits = (raw || PHONE_FALLBACK).replace(/\D/g, '')
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return `tel:+1${local}`
}