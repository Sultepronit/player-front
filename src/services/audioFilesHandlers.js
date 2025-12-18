import setPause from "../../helpers/setPause";
import { getFileFromStorage } from "./api/storage";
import { getStoredItem, storeItem } from "./localDbHandlers";
import { addMessage } from "../handleMessages";

const ratingInput = document.getElementById('rating');

export async function getLocalFile(filename) {
    return await getStoredItem('files', filename, 'blob');
}

let isBusy = false;
export async function fetchAndStoreRemoteFile(filename, fetchAnyway) { 
    if (isBusy && !fetchAnyway) {
        // await setPause(500);
        return false;
    }

    isBusy = true;
    console.log('fetching:', filename);
    const audioBlob = await getFileFromStorage(filename);

    await storeItem('files', { filename, blob: audioBlob });
    console.log('fetched:', filename, audioBlob);
    isBusy = false;
    return true;
}

function findRandom(history, localFiles) {
    let mediaIndex = 0;
    for(let i = 0; i < 10; i++) {
        mediaIndex = localFiles[Math.floor(Math.random() * localFiles.length)] - 1;
        console.log(i, mediaIndex);
        const historyIndex = history.set.findIndex(e => e === mediaIndex);
        console.log(historyIndex, history.set.length - history.recycle);
        if (historyIndex <= history.set.length - history.recycle) break;
    }
    return mediaIndex;
}

export async function findAvailable(playlist, history, localFiles) {
    while (!localFiles.length) await setPause(500);
    
    let trackIndex = 0;  
    let trackInfo = { rating: 0 };

    for (let i = 0; i < 20; i++) {
        const index = findRandom(history, localFiles)   
        const info = playlist[index];
        console.log(index, info);

        const randomNorm = (Math.random() * 100);
        console.log('randomNorm:', randomNorm);

        if (trackInfo.rating < info.rating) {
            trackIndex = index;
            trackInfo = info;
        }

        if (info.rating >= ratingInput.value && info.rating >= randomNorm) break;
        console.log('tries:', i);
        console.log('best so far:', trackInfo);
    }

    return trackInfo;
}