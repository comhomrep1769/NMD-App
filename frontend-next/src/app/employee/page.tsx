// This file stays at /employee/page.tsx as a redirect for backward compat
import { redirect } from 'next/navigation'
export default function EmployeeRedirect() {
  redirect('/dashboard/employee')
}