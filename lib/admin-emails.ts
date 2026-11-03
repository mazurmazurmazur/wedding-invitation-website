import 'server-only'

export function adminEmails() {
  return (process.env.WEDDING_ADMIN_EMAILS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email) && adminEmails().includes(email!.trim().toLowerCase())
}
