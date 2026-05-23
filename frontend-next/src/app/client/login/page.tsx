New-Item -ItemType Directory -Force -Path frontend-next/src/app/client/login
Set-Content frontend-next/src/app/client/login/page.tsx -Value @'
import LoginPageClient from '@/components/portal/LoginPageClient'
export default function ClientLoginPage() {
  return <LoginPageClient portalRole="client" />
}
'@