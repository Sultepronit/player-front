// import setPause from "../helpers/setPause";
// let db = null;

function openLocalDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('audioDb', 6);

        request.onupgradeneeded = () => {
            console.log('upgrading indexedDB!');
            const db = request.result;
            // db.createObjectStore('details', { keyPath: 'id' });
            db.createObjectStore('playlist', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'filename' });
            }
        };

        request.onerror = () => {
            console.error(request.error);
            reject('Error opening IndexedDb!');
        };

        request.onsuccess = () => {
            // db = request.result;
            console.timeLog('t', 'local db opened!!!');
            // resolve('success!');
            resolve(request.result);
        };
    });
}

const dbPromise = openLocalDb();

export async function resotrePlaylist() {
    const db = await dbPromise;
    const transaction = db.transaction('playlist');
    const store = transaction.objectStore('playlist');

    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getStoredItem(storeName, id, valueName) {
    const db = await dbPromise;

    const transaction = db.transaction(storeName);
    const store = transaction.objectStore(storeName);

    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            // console.log('Get from local db!');
            if(request.result) {
                resolve(request.result[valueName]);
            } else {
                resolve(null);
            }
        };

        request.onerror = () => {
            console.error(request.error);
            reject('failed!');
        };
    });
}

export async function backupPlaylist(playlist) {
    const db = await dbPromise;
    const transaction = db.transaction('playlist', 'readwrite');
    const store = transaction.objectStore('playlist');

    for (const entry of playlist) {
        const request = store.put(entry);
        request.onerror = () => console.warn(request.error);
    }

    return new Promise((resolve, reject) => {
        transaction.oncolmplete = () => resolve('success');
        transaction.onerror = () => reject(transaction.error);
    });
}    

export async function storeItem(storeName, item) {
    const db = await dbPromise;

    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    const request = store.put(item);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            console.log(`Saved to ${storeName}!`);
            resolve('saved!');
        };

        request.onerror = () => {
            console.error(request.error);
            reject('failed!');
        };
    });
}

