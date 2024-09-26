import { setPause } from "./helpers";

let db = null;

function openLocalDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('audioDb', 1);

        request.onupgradeneeded = () => {
            console.log('upgrading indexedDB!');
            db = request.result;
            db.createObjectStore('audioFiles', { keyPath: 'id' });
        };

        request.onerror = () => {
            console.error(request.error);
            reject('Error opening IndexedDb!');
        };

        request.onsuccess = () => {
            db = request.result;
            console.timeLog('t', 'local db opened!');
            resolve('success!');
        };
    });
}

openLocalDb();

export async function getFile(id) {
    if(!db) {
        await setPause(100);
        return getFile(id);
    }

    const transaction = db.transaction('audioFiles');
    const store = transaction.objectStore('audioFiles');

    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            console.timeLog('t', 'Get from local db!');
            // console.log('Get from local db!');
            resolve(request.result.audioBlob);
        };

        request.onerror = () => {
            console.error(request.error);
            reject('failed!');
        };
    });
}

export function saveFile(id, blob) {
    if(!db) {
        setTimeout(() => saveFile(id, blob), 200);
        return;
    }

    const transaction = db.transaction('audioFiles', 'readwrite');
    const store = transaction.objectStore('audioFiles');

    const request = store.put({ id, audioBlob: blob });

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            console.log('Saved to local db!');
            resolve('saved!');
        };

        request.onerror = () => {
            console.error(request.error);
            reject('failed!');
        };
    });
}