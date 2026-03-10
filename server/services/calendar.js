import { google } from 'googleapis';

export async function getTodayEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items || []).map(event => ({
    id: event.id,
    summary: event.summary,
    start: event.start,
    end: event.end,
    htmlLink: event.htmlLink,
    location: event.location,
    description: event.description,
  }));
}
