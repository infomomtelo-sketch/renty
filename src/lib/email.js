// Global email configuration
export const CONTACT_EMAIL = 'support@rentyapp.net'
export const SUPPORT_EMAIL = 'support@rentyapp.net'
export const HELP_EMAIL = 'help@rentyapp.net'

export const emailConfig = {
  support: SUPPORT_EMAIL,
  contact: CONTACT_EMAIL,
  help: HELP_EMAIL,
  // Add more as needed
}

export const getEmailLink = (type = 'support', subject = '', body = '') => {
  const email = emailConfig[type] || CONTACT_EMAIL
  const params = new URLSearchParams()
  if (subject) params.append('subject', subject)
  if (body) params.append('body', body)
  return `mailto:${email}${params.toString() ? '?' + params.toString() : ''}`
}
