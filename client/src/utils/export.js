/**
 * Client-side export utilities — generates deep links and files
 * so the app doesn't need sensitive Google OAuth scopes.
 */

// ── Google Calendar deep link ─────────────────────────────────

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return null;
}

function normalizeTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return null;
}

function toCalendarDateStr(date, time) {
  // Format: YYYYMMDDTHHMMSS (local time, no Z suffix)
  const d = date.replace(/-/g, '');
  const t = (time || '09:00').replace(/:/g, '') + '00';
  return `${d}T${t}`;
}

export function buildCalendarUrl(event) {
  const date = parseDate(event.date);
  if (!date) return null;

  const startTime = normalizeTime(event.time) || '09:00';
  let endTime = normalizeTime(event.endTime);
  if (!endTime) {
    const [h, m] = startTime.split(':').map(Number);
    const dur = event.duration || 60;
    const total = h * 60 + m + dur;
    endTime = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  const start = toCalendarDateStr(date, startTime);
  const end = toCalendarDateStr(date, endTime);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.eventTitle || event.title || 'Untitled Event',
    dates: `${start}/${end}`,
  });

  if (event.location) params.set('location', event.location);
  if (event.description) params.set('details', event.description);
  if (event.attendees?.length) {
    params.set('add', event.attendees.join(','));
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── ICS file generation (Apple Calendar / any calendar app) ──

export function buildIcsFile(event) {
  const date = parseDate(event.date);
  if (!date) return null;

  const startTime = normalizeTime(event.time) || '09:00';
  let endTime = normalizeTime(event.endTime);
  if (!endTime) {
    const [h, m] = startTime.split(':').map(Number);
    const dur = event.duration || 60;
    const total = h * 60 + m + dur;
    endTime = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  const start = toCalendarDateStr(date, startTime);
  const end = toCalendarDateStr(date, endTime);
  const title = event.eventTitle || event.title || 'Untitled Event';
  const uid = `snappy-${Date.now()}-${Math.random().toString(36).slice(2)}@snappy.app`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Snappy//Snappy App//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
  ];

  if (event.location) lines.push(`LOCATION:${event.location}`);
  if (event.description) lines.push(`DESCRIPTION:${event.description}`);
  if (event.attendees?.length) {
    event.attendees.forEach(email => {
      lines.push(`ATTENDEE;CN=${email}:mailto:${email}`);
    });
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(events) {
  const evts = Array.isArray(events) ? events : [events];
  evts.forEach((evt, i) => {
    const ics = buildIcsFile(evt);
    if (!ics) return;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const title = (evt.eventTitle || evt.title || 'event').replace(/[^a-zA-Z0-9]/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.ics`;
    document.body.appendChild(a);
    setTimeout(() => {
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, i * 300);
  });
}

// ── Google Contacts deep link ─────────────────────────────────

export function buildContactUrl(contact) {
  const params = new URLSearchParams();

  if (contact.name) params.set('name', contact.name);
  if (contact.email) params.set('email', contact.email);
  if (contact.phone) params.set('phone', contact.phone);
  if (contact.company || contact.organization) {
    params.set('company', contact.company || contact.organization);
  }
  if (contact.title || contact.jobTitle) {
    params.set('jobtitle', contact.title || contact.jobTitle);
  }

  return `https://contacts.google.com/new?${params.toString()}`;
}

// ── vCard generation ──────────────────────────────────────────

export function buildVCard(contact) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
  ];

  const name = contact.name || '';
  const parts = name.split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  lines.push(`FN:${name}`);
  lines.push(`N:${lastName};${firstName};;;`);

  if (contact.email) lines.push(`EMAIL:${contact.email}`);
  if (contact.phone) lines.push(`TEL:${contact.phone}`);
  if (contact.company || contact.organization) {
    lines.push(`ORG:${contact.company || contact.organization}`);
  }
  if (contact.title || contact.jobTitle) {
    lines.push(`TITLE:${contact.title || contact.jobTitle}`);
  }
  if (contact.address) lines.push(`ADR:;;${contact.address};;;;`);
  if (contact.website || contact.url) {
    lines.push(`URL:${contact.website || contact.url}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVCard(contact) {
  const vcard = buildVCard(contact);
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const name = (contact.name || 'contact').replace(/[^a-zA-Z0-9]/g, '_');
  const file = new File([blob], `${name}.vcf`, { type: 'text/vcard' });

  // Try Web Share API first (mobile) — opens contact app directly
  if (navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file] }).catch(() => {});
    return;
  }

  // Fallback: open blob URL so OS handles the VCF
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── File download (receipts/documents) ────────────────────────

export function downloadImage(dataUrl, fileName) {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName || 'snappy-document.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
