import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_MAP = {
  receipt: 'Snappy/Receipts',
  document: 'Snappy/Documents',
  contact: 'Snappy/Contacts',
  calendar: 'Snappy/Calendar',
};

async function findOrCreateFolder(drive, name, parentId = null) {
  const query = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

  const res = await drive.files.list({ q: query, fields: 'files(id, name)' });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
  });

  return folder.data.id;
}

async function ensureFolderPath(drive, path) {
  const parts = path.split('/');
  let parentId = null;

  for (const part of parts) {
    parentId = await findOrCreateFolder(drive, part, parentId);
  }

  return parentId;
}

export async function uploadFile(auth, { buffer, mimeType, fileName, classificationType }) {
  const drive = google.drive({ version: 'v3', auth });
  const folderPath = FOLDER_MAP[classificationType] || 'Snappy/Other';
  const folderId = await ensureFolderPath(drive, folderPath);

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName || `${classificationType}_${Date.now()}.png`,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType || 'image/png',
      body: stream,
    },
    fields: 'id, name, webViewLink, webContentLink',
  });

  return {
    id: res.data.id,
    name: res.data.name,
    webViewLink: res.data.webViewLink,
    webContentLink: res.data.webContentLink,
  };
}

export async function listFolders(auth) {
  const drive = google.drive({ version: 'v3', auth });

  const snappyFolder = await drive.files.list({
    q: "name='Snappy' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id, name)',
  });

  if (snappyFolder.data.files.length === 0) {
    return [];
  }

  const parentId = snappyFolder.data.files[0].id;
  const subfolders = await drive.files.list({
    q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  const results = [];
  for (const folder of subfolders.data.files) {
    const files = await drive.files.list({
      q: `'${folder.id}' in parents and trashed=false`,
      fields: 'files(id)',
    });
    results.push({
      id: folder.id,
      name: folder.name,
      fileCount: files.data.files.length,
    });
  }

  return results;
}
