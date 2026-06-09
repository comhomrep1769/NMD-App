// This file stays at /dashboard/page.tsx as a redirect for backward compat
import { redirect } from 'next/navigation'
export default function DashboardRedirect() {
  redirect('/dashboard/admin')
}