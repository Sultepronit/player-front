import setPause from "../helpers/setPause";
import { getFileFromStorage, getFileUrl } from "../src/services/api/storage";
import { fetchBlob } from "./api";
import { getStoredItem, storeItem } from "./localDbHandlers";

const ratingInput = document.getElementById('rating');

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
    // const audioBlob = await getFileFromStorage(filename);
    // const audioBlob = await fetchBlob(filename);
    const audioBlob = await getFileFromStorage(filename) || await fetchBlob(filename);

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

// let minRating = 50;
// document.getElementById('rating').addEventListener('change', (e) => {
//     // console.log(e.target.value);
//     minRating = e.target.value;
// });

let limit = 0;
function tryAndFindAcceptable(playlist, futureList) {
    const mediaIndex = futureList[Math.floor(Math.random() * futureList.length)];
    const mediaInfo = playlist[mediaIndex];

    // console.log(minRating, mediaInfo, limit);
    if (mediaInfo.rating < ratingInput.value && limit++ < 1000) {
        return tryAndFindAcceptable(playlist, futureList);
    }
    // console.log('Finish!');

    limit = 0;
    return { mediaIndex, mediaInfo };
}

export async function tryAndFindAvailable(playlist, futureList) {
    // trying to get random file
    // const mediaIndex = futureList[Math.floor(Math.random() * futureList.length)];
    // const mediaInfo = playlist[mediaIndex];
    const { mediaIndex, mediaInfo } = tryAndFindAcceptable(playlist, futureList);
    const mediaFile = await getLocalFile(mediaInfo.filename);
    if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };

    // immediately fetching the unavailable file for more or less near future
    fetchAndStoreRemoteFile(mediaInfo.filename);

    // trying to find available file through all the list
    // repeating time after time if no success, waiting for the file to become available
    console.log('searching for available file');
    for (let tries = 0; tries < 300; tries++) { // like 10 minutes of tries
        let limit = 0;
        for (const mediaIndex of futureList) {
            const mediaInfo = playlist[mediaIndex];

            // console.log(minRating, mediaInfo, limit);
            if (mediaInfo.rating < ratingInput.value && limit++ < futureList.length / 2) {
                continue;
            }
            // console.log('Finish!');

            const mediaFile = await getLocalFile(mediaInfo.filename);
            if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };
        }

        await setPause(2000);
    }
}