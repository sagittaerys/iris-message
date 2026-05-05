interface StoredRefreshToken {
  id: "refresh_token";
  token: string;
}

interface StoredKeyBundle {
  id: "key_bundle";
  wrappedPrivateKey: string;
  pbkdf2Salt: string;
  publicKeyB64: string;
  iv: string;
}

const DB_NAME = "iris_vault";
const DB_VERSION = 1;
const KEY_STORE = "key_store";
const TOKEN_STORE = "token_store";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(TOKEN_STORE)) {
        db.createObjectStore(TOKEN_STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbSet<T extends { id: string }>(
  storeName: string,
  value: T,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

function idbGet<T>(storeName: string, id: string): Promise<T | null> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

function idbDelete(storeName: string, id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveKeyBundle(bundle: {
  wrappedPrivateKey: string;
  pbkdf2Salt: string;
  publicKeyB64: string;
  iv: string;
}): Promise<void> {
  await idbSet<StoredKeyBundle>(KEY_STORE, { id: "key_bundle", ...bundle });
}

export async function loadKeyBundle(): Promise<Omit<
  StoredKeyBundle,
  "id"
> | null> {
  const result = await idbGet<StoredKeyBundle>(KEY_STORE, "key_bundle");
  if (!result) return null;
  const { id: _id, ...bundle } = result;
  return bundle;
}

export async function clearKeyBundle(): Promise<void> {
  await idbDelete(KEY_STORE, "key_bundle");
}

export async function saveRefreshToken(token: string): Promise<void> {
  await idbSet<StoredRefreshToken>(TOKEN_STORE, { id: "refresh_token", token });
}

export async function loadRefreshToken(): Promise<string | null> {
  const result = await idbGet<StoredRefreshToken>(TOKEN_STORE, "refresh_token");
  return result?.token ?? null;
}

export async function clearRefreshToken(): Promise<void> {
  await idbDelete(TOKEN_STORE, "refresh_token");
}

// clears all data in the vault ( to be used on logout)
export async function clearVault(): Promise<void> {
  await Promise.all([clearKeyBundle(), clearRefreshToken()]);
}
