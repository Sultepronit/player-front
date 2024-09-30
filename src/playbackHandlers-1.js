import { audio, filenameDisplay, statusDisplay } from '../main';
import { fetchBlob } from '../services/api';
import { getStoredItem, storeItem } from "../services/localDbHandlers";
import updateFilenames from "../services/updateFilenames";

let filenames = [];
let listIndex = -1;
const pastList = [];
let currentMedia = null;
let nextMedia = null;
const futureList = [];

export async function startSession() {
    filenames = await getStoredItem('filenames', 'filenames', 'data');
    console.log(filenames);
    console.timeLog('t', 'Restored filenames(?)');

    if(!filenames) {
        filenames = await updateFilenames();
        if (filenames) {
            storeItem('filenames', { id: 'filenames', data: filenames });
        } 
    } else {
        updateFilenames().then(remoteFilenames => {
            if (remoteFilenames && remoteFilenames.length !== filenames?.length) {
                storeItem('filenames', { id: 'filenames', data: remoteFilenames });
            } 
        })
    }

    futureList.push(...filenames);

    choseNext();
    console.timeLog('t', 'Starting playback...');
}

async function getBlob(filename, doFetchRemote = false) {
    console.log('filename:', filename);
    // filenameDisplay.innerText = filename;

    let audioBlob = await getStoredItem('files', filename, 'blob');
    console.log('stored:', audioBlob);

    if(audioBlob) return audioBlob;

    if (doFetchRemote) {
        statusDisplay.innerText = 'loading...';

        audioBlob = await fetchBlob(filename);
        console.log('fetched:', audioBlob);
        if (audioBlob) {
            storeItem('files', { filename, blob: audioBlob });
            statusDisplay.innerText = '';
            
            return audioBlob;
        } else {
            statusDisplay.innerText = 'Load failed!';
        }
    } 

    return null;
}

// function selectRandomMedia() {
//     const index = Math.floor(Math.random() * futureList.length);
//     const media = futureList[index];
//     // futureList.splice(index, 1);
//     // console.log(futureList);
//     return { media, index };
// }

const newMedia = null; // in case that there is media file still not saved locally
async function tryAndFindAvailable() {
    let tries = 0;
    const limit = 10;
    let futureIndex = 0;
    let filename = null;
    let file = null;
    let reservedMedia = null;

    // here we are nullifying previous newMedia
    // letting algorithm to find common media & maybe next newMedia
    if (newMedia?.file) { 
        reservedMedia = { ...newMedia };
        newMedia = null;
    }

    for(; tries < limit; tries++) { // here we are trying to get only available file
        futureIndex = Math.floor(Math.random() * futureList.length);
        filename = futureList[futureIndex];
        file = await getBlob(filename);

        if(file) break;

        if (!newMedia) { // here we are trying to make available what is not
            // newMedia = { futureIndex, filename };
        }
    }

    if (tries === limit) {
        if (reservedMedia) { // and here we are using the reservedMedia, instead of waiting for loading
            futureIndex = reservedMedia.futureIndex;
            filename = reservedMedia.filename;
            file = reservedMedia.file;
        } else { // this one is from last of tries
            file = await getBlob(filename, true); 
        }
    }

    futureList.splice(futureIndex, 1);
    console.log(futureList);

    if(newMedia) { // this one is from first of tries
        getBlob(newMedia.filename, true).then(file => newMedia.file = file);
    }

    return { filename, file };
}

export async function choseNext(play = false) {
    if(nextMedia) {
        currentMedia = nextMedia;
        await setSrc(currentMedia);
    } else {
        const found = await tryAndFindAvailable();
        filenameDisplay.innerText = found.filename;
        audio.src = URL.createObjectURL(found.file);
    }

    if (play) audio.play();
}

export async function chosePrevisous(play = false) {
    listIndex--;
    if(listIndex < 0) listIndex = filenames.length - 1;
    await setSrc(filenames[listIndex]);

    if (play) audio.play();
}