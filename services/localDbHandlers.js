import setPause from "../helpers/setPause";

let db = null;

function openLocalDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('audioDb', 3);

        request.onupgradeneeded = () => {
            console.log('upgrading indexedDB!');
            const upgradingDb = request.result;
            upgradingDb.createObjectStore('filenames', { keyPath: 'id' });
            if (upgradingDb.objectStoreNames.contains('files')) {
                upgradingDb.deleteObjectStore('files');
            }
            upgradingDb.createObjectStore('files', { keyPath: 'filename' });
        };

        request.onerror = () => {
            console.error(request.error);
            reject('Error opening IndexedDb!');
        };

        request.onsuccess = () => {
            db = request.result;
            console.timeLog('t', 'local db opened!!!');
            resolve('success!');
        };
    });
}

openLocalDb();

export async function getStoredItem(storeName, id, valueName) {
    // console.log(`trying to get ${storeName}`);
    // console.log(id, valueName);

    if(!db) {
        await setPause(100);
        return getStoredItem(storeName, id, valueName);
    }

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

export function storeItem(storeName, item) {
    if(!db) {
        setTimeout(() => storeItem(storeName, item), 200);
        return;
    }

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

