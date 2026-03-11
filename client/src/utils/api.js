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
    const err = new Error(data.message || data.error || 'Request failed');
    if (res.status === 401 || data.reauth) {
      err.reauth = true;
    }
    throw err;
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

  // Share
  composeMessage: (classificationData) =>
    request('/share/compose', {
      method: 'POST',
      body: JSON.stringify({ classificationData }),
    }),

  composeReachOut: (contactData, channel) =>
    request('/share/compose-reachout', {
      method: 'POST',
      body: JSON.stringify({ contactData, channel }),
    }),

  // Daily Snap
  getDailySnap: (notesParam = '') =>
    request(`/snap/daily${notesParam ? `?notes=${notesParam}` : ''}`),
};
