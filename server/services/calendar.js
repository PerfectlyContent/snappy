import { google } from 'googleapis';

function normalizeTime(timeStr) {
  if (!timeStr) return null;
  // Strip whitespace and handle common formats
  const t = timeStr.trim();
  // Already HH:MM or HH:MM:SS
  const match = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }
  return null;
}

function parseEventDate(dateStr) {
  if (!dateStr) return null;
  const d = dateStr.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // Try to parse other formats
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return null;
}

export async function createEvent(auth, eventData) {
  const calendar = google.calendar({ version: 'v3', auth });

  const date = parseEventDate(eventData.date);
  if (!date) {
    throw new Error(`Invalid or missing event date: "${eventData.date}"`);
  }

  const timeStr = normalizeTime(eventData.time) || '09:00';
  const timeZone = eventData.timeZone || 'UTC';

  let endTimeStr = normalizeTime(eventData.endTime);
  if (!endTimeStr) {
    // Default to 1 hour after start
    const durationMinutes = eventData.duration || 60;
    const [h, m] = timeStr.split(':').map(Number);
    const totalMin = h * 60 + m + durationMinutes;
    endTimeStr = `${String(Math.floor(totalMin / 60) % 24).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  }

  // Send local time directly to Google — no Date object conversion
  const startDateTimeStr = `${date}T${timeStr}:00`;
  const endDateTimeStr = `${date}T${endTimeStr}:00`;

  console.log('Creating event:', eventData.eventTitle || eventData.title, 'on', date, 'at', timeStr, 'tz:', timeZone);

  const event = {
    summary: eventData.eventTitle || eventData.title || 'Untitled Event',
    location: eventData.location || '',
    description: eventData.description || '',
    start: {
      dateTime: startDateTimeStr,
      timeZone,
    },
    end: {
      dateTime: endDateTimeStr,
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  if (eventData.attendees?.length) {
    const validAttendees = eventData.attendees
      .filter(email => email && typeof email === 'string' && email.includes('@'));
    if (validAttendees.length) {
      event.attendees = validAttendees.map(email => ({ email }));
    }
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return {
    id: res.data.id,
    htmlLink: res.data.htmlLink,
    summary: res.data.summary,
    start: res.data.start,
    end: res.data.end,
  };
}

export async function getUpcoming(auth, maxResults = 10) {
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items.map(event => ({
    id: event.id,
    summary: event.summary,
    start: event.start,
    end: event.end,
    htmlLink: event.htmlLink,
    location: event.location,
  }));
}
