import { DateTime } from 'luxon';

export const generateICS = (event) => {
  if (!event.date || !event.startTime || !event.endTime) {
    console.error('❌ Missing date or time in event:', event);
    return null;
  }

  // 🔹 Konvertiere `event.date` sicher von ISO in `yyyy-MM-dd`
  const eventDate = DateTime.fromISO(event.date).toFormat("yyyy-MM-dd");

  // 🕑 Konvertiere die Zeit nach UTC für Google
  const formatUTC = (date, time) => {
    const dt = DateTime.fromISO(date).setZone("Europe/Berlin");
    if (!dt.isValid) {
      console.error('❌ Invalid date/time:', date, time);
      return null;
    }
    return dt.plus({ hours: parseInt(time.split(":")[0]), minutes: parseInt(time.split(":")[1]) })
      .toUTC()
      .toFormat("yyyyMMdd'T'HHmmss'Z'");
  };

  // 🕑 Konvertiere die Zeit nach lokaler Berlin-Zeit für iCloud
  const formatBerlinTime = (date, time) => {
    const dt = DateTime.fromISO(date).setZone("Europe/Berlin");
    if (!dt.isValid) {
      console.error('❌ Invalid Berlin time:', date, time);
      return null;
    }
    return dt.plus({ hours: parseInt(time.split(":")[0]), minutes: parseInt(time.split(":")[1]) })
      .toFormat("yyyyMMdd'T'HHmmss");
  };

  // 📌 Zeiten für Google (UTC)
  const formattedStartUTC = formatUTC(event.date, event.startTime);
  const formattedEndUTC = formatUTC(event.date, event.endTime);

  // 📌 Zeiten für iCloud (lokal Berlin)
  const formattedStartBerlin = formatBerlinTime(event.date, event.startTime);
  const formattedEndBerlin = formatBerlinTime(event.date, event.endTime);

  console.log('📌 Debug: ICS Event Zeiten:', { eventDate, formattedStartUTC, formattedEndUTC, formattedStartBerlin, formattedEndBerlin });

  if (!formattedStartUTC || !formattedEndUTC || !formattedStartBerlin || !formattedEndBerlin) {
    console.error('❌ Error formatting start or end time:', event);
    return null;
  }

  // 📝 iCalendar-Datei mit `TZID` für iCloud und UTC für Google
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dress-Code-Wizard//NONSGML v1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
DTSTART:19810329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
TZNAME:CEST
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
DTSTART:19961027T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
TZNAME:CET
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:event-${event.id || Date.now()}@dress-code-wizard.com
DTSTAMP:${DateTime.now().toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}
DTSTART;TZID=Europe/Berlin:${formattedStartBerlin}
DTEND;TZID=Europe/Berlin:${formattedEndBerlin}
SUMMARY:${event.name}
DESCRIPTION:Dress Code: ${event.dress_code}
LOCATION:${event.location || 'Online'}
END:VEVENT
END:VCALENDAR`;

  console.log('📝 Generierte iCalendar-Datei:\n', icsContent);

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  return URL.createObjectURL(blob);
};
