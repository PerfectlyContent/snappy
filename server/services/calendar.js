import { google } from 'googleapis';

export async function createEvent(auth, eventData) {
  const calendar = google.calendar({ version: 'v3', auth });

  const timeStr = eventData.time || '09:00';
  const startDateTime = new Date(`${eventData.date}T${timeStr}:00`);
  let endDateTime;
  if (eventData.endTime) {
    endDateTime = new Date(`${eventData.date}T${eventData.endTime}:00`);
  } else {
    const durationMinutes = eventData.duration || 60;
    endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
  }
  console.log('Creating event:', eventData.eventTitle, 'on', eventData.date, 'at', timeStr, '→', startDateTime.toISOString());

  const event = {
    summary: eventData.eventTitle || eventData.title,
    location: eventData.location || '',
    description: eventData.description || '',
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
