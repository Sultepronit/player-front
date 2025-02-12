import setPause from "../helpers/setPause";
import { getFileFromStorage } from "../src/services/api/storage";
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
    // const audioBlob = await getFileFromStorage(filename) || await fetchBlob(filename);
    const audioBlob = await getFileFromStorage(filename);

    await storeItem('files', { filename, blob: audioBlob });
    console.log('fetched:', filename, audioBlob);

    queue.delete(filename); 

    if (queue.size) reduceQueue();
}

export async function fetchAndStoreRemoteFile(filename) { 
    console.log('next in queue:', filename);

    if(queue.size >= 2) return;

    if (queue.size) {
        queue.add(filename);
        return;
    }

    queue.add(filename);
    reduceQueue();
}

let improveRatingTries = 0;
let searchTries = 0;
const bestSoFar = { mediaInfo: { rating: 0 } };
export async function tryAndFindAvailable(playlist, futureList) {
    // trying to get random file
    let mediaIndex = futureList[Math.floor(Math.random() * futureList.length)];
    let mediaInfo = playlist[mediaIndex];

    console.log('improveRatingTries:', improveRatingTries);
    // sending a dummy if it does not meet the requirements: we'll be back soon
    const randomNorm = (Math.random() * 100);
    console.log('randomNorm:', randomNorm);
    // if (mediaInfo.rating < ratingInput.value || mediaInfo.rating < (Math.random() * 100)) {
    if (mediaInfo.rating < ratingInput.value || mediaInfo.rating < randomNorm) {
        if (bestSoFar.mediaInfo.rating < mediaInfo.rating) {
            bestSoFar.mediaIndex = mediaIndex;
            bestSoFar.mediaInfo = mediaInfo;
            console.log('best so far:', bestSoFar.mediaInfo);
        }

        if (improveRatingTries++ < 20) {
            return { mediaIndex, pass: true };
        } else {
            mediaIndex = bestSoFar.mediaIndex;
            mediaInfo = bestSoFar.mediaInfo;
        }
    }
    improveRatingTries = 0;

    // trying to get the local blob
    const mediaFile = await getLocalFile(mediaInfo.filename);
    if(mediaFile) {
        searchTries = 0;
        return { mediaIndex, mediaInfo, mediaFile };
    }

    // fetching the unavailable file for more or less near future
    fetchAndStoreRemoteFile(mediaInfo.filename);

    // recursively trying to find available file
    // if there is no result, we are giving it some time to fetch and returning a dummy
    console.log('searchTries:', searchTries);
    if (searchTries++ >= 50) {
        searchTries = 0;
        await setPause(500);
        return { mediaIndex, pass: true };
    }

    return await tryAndFindAvailable(playlist, futureList);
}