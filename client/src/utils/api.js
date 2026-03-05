const BASE = '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  getAuthStatus: () => request('/auth/status'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Classify
  classifyImage: (image, mimeType) =>
    request('/classify/image', {
      method: 'POST',
      body: JSON.stringify({ image, mimeType }),
    }),

  classifyImageFile: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/classify/image', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Classification failed');
    return data;
  },

  classifyVoice: (transcript) =>
    request('/classify/voice', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    }),

  // Calendar
  createEvent: (eventData) =>
    request('/calendar/event', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),

  getUpcomingEvents: () => request('/calendar/upcoming'),

  // Drive
  uploadToDrive: async (file, classificationType, fileName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classificationType', classificationType);
    if (fileName) formData.append('fileName', fileName);
    const res = await fetch('/drive/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  uploadBase64ToDrive: (image, mimeType, classificationType, fileName) =>
    request('/drive/upload', {
      method: 'POST',
      body: JSON.stringify({ image, mimeType, classificationType, fileName }),
    }),

  getDriveFolders: () => request('/drive/folders'),

  // Contacts
  createContact: (contactData) =>
    request('/contacts/create', {
      method: 'POST',
      body: JSON.stringify(contactData),
    }),

  getRecentContacts: () => request('/contacts/recent'),

  // Share
  composeMessage: (classificationData) =>
    request('/share/compose', {
      method: 'POST',
      body: JSON.stringify({ classificationData }),
    }),

  sendMessage: (to, subject, body) =>
    request('/share/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    }),

  composeReachOut: (contactData, channel) =>
    request('/share/compose-reachout', {
      method: 'POST',
      body: JSON.stringify({ contactData, channel }),
    }),
};
