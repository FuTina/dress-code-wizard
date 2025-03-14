import { format } from 'date-fns'

/**
 * Generates an iCalendar (.ics) file for an event.
 * @param {Object} event - The event object
 * @returns {string} - The ICS file content
 */
export function generateICS(event) {
  const dtStart = format(new Date(event.startdate), "yyyyMMdd'T'HHmmss'Z'")
  const dtEnd = format(new Date(event.enddate), "yyyyMMdd'T'HHmmss'Z'")
  const uid = `event-${event.id}@dress-code-wizard.com`

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dress-Code Wizard//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${event.name}
DESCRIPTION:Dress Code: ${event.dress_code}
LOCATION:${event.location || 'Online'}
END:VEVENT
END:VCALENDAR`
}

/**
 * Triggers a file download for an .ics event file.
 * @param {Object} event - The event object
 */
export function downloadICS(event) {
  const icsContent = generateICS(event)
  const blob = new Blob([icsContent], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.name}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
