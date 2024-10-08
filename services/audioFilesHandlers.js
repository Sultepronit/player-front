import setPause from "../helpers/setPause";
import { fetchBlob } from "./api";
import { getStoredItem, storeItem } from "./localDbHandlers";

export async function getLocalFile(filename) {
    return await getStoredItem('files', filename, 'blob');
}

// there can be caotic requests for differet or even one and the same file,
// but we must fetch them one by one
const queue = new Set();
async function reduceQueue() {
    console.log(queue);
    const filename = [...queue][0];

    console.log('fetching:', filename);
    const audioBlob = await fetchBlob(filename);

    await storeItem('files', { filename, blob: audioBlob });
    console.log('fetched:', filename, audioBlob);

    queue.delete(filename); 

    if (queue.size) reduceQueue();
}

export async function fetchAndStoreRemoteFile(filename) { 
    console.log('next in queue:', filename);

    if (queue.size) {
        queue.add(filename);
        return;
    }

    queue.add(filename);
    reduceQueue();
}

export async function tryAndFindAvailable(playlist, futureList) {
    // trying to get random file
    const mediaIndex = futureList[Math.floor(Math.random() * futureList.length)];
    const mediaInfo = playlist[mediaIndex];
    const mediaFile = await getLocalFile(mediaInfo.filename);
    if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };

    // immediately fetching the unavailable file for more or less near future
    fetchAndStoreRemoteFile(mediaInfo.filename);

    // trying to find available file through all the list
    // repeating time after time if no success, waiting for the file to become available
    console.log('searching for available file');
    for (let tries = 0; tries < 300; tries++) { // like 10 minutes of tries
        for (const mediaIndex of futureList) {
            const mediaInfo = playlist[mediaIndex];
            const mediaFile = await getLocalFile(mediaInfo.filename);
            if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };
        }

        await setPause(2000);
    }
}