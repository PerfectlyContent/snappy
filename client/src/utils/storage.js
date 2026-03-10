const DB_NAME = 'snappy_library';
const DB_VERSION = 1;
const STORE_NAME = 'items';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(mode, fn) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const result = fn(store);
      transaction.oncomplete = () => resolve(result._value);
      transaction.onerror = () => reject(transaction.error);
      if (result instanceof IDBRequest) {
        result.onsuccess = () => { result._value = result.result; };
      }
    });
  });
}

/**
 * Save an item to the library.
 * @param {{ type: string, data: object, image?: string, fileName?: string }} item
 * @returns {Promise<string>} The saved item's id
 */
export async function saveItem(item) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const record = {
    id,
    type: item.type,
    data: item.data,
    image: item.image || null,
    fileName: item.fileName || null,
    timestamp: new Date().toISOString(),
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readwrite');
    t.objectStore(STORE_NAME).put(record);
    t.oncomplete = () => resolve(id);
    t.onerror = () => reject(t.error);
  });
}

/**
 * Get all items, sorted newest first.
 * @param {string} [typeFilter] Optional type filter
 * @returns {Promise<Array>}
 */
export async function getItems(typeFilter) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readonly');
    const store = t.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      let items = request.result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      if (typeFilter) items = items.filter(i => i.type === typeFilter);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single item by id.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readonly');
    const request = t.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an item by id.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readwrite');
    t.objectStore(STORE_NAME).delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

/**
 * Get count of items, optionally by type.
 * @param {string} [typeFilter]
 * @returns {Promise<number>}
 */
export async function getItemCount(typeFilter) {
  const items = await getItems(typeFilter);
  return items.length;
}
