// This file stays at /client/page.tsx as a redirect for backward compat
import { redirect } from 'next/navigation'
export default function ClientRedirect() {
  redirect('/clientdashboard')
}