import { DateTime } from "luxon";

export const generateICS = (event) => {
  if (!event.date || !event.startTime || !event.endTime) {
    console.error("❌ Missing date or time in event:", event);
    return null;
  }

  const formatDateTime = (date, time) => {
    return DateTime.fromISO(`${date}T${time}:00`, { zone: "Europe/Berlin" })
      .toUTC()
      .toFormat("yyyyMMdd'T'HHmmss'Z'");
  };

  const formattedStart = formatDateTime(event.date, event.startTime);
  const formattedEnd = formatDateTime(event.date, event.endTime);

  if (!formattedStart || !formattedEnd) {
    console.error("❌ Error formatting start or end time:", event);
    return null;
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.name}
DTSTART:${formattedStart}
DTEND:${formattedEnd}
DESCRIPTION:Dress Code: ${event.dress_code}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: "text/calendar" });
  return URL.createObjectURL(blob);
};
