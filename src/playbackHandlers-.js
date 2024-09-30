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

async function setSrc(filename) {
    filenameDisplay.innerText = filename;
    statusDisplay.innerText = 'loading...';

    let audioBlob = await getStoredItem('files', filename, 'blob');
    console.log('stored:', audioBlob);

    if (!audioBlob) {
        // const apiUrl = import.meta.env.VITE_API_URL;
        // audio.src = `${apiUrl}/files/${filename}`;

        audioBlob = await fetchBlob(filename);
        console.log('fetched:', audioBlob);
        if (audioBlob) {
            storeItem('files', { filename, blob: audioBlob });
        } else {
            statusDisplay.innerText = 'Load failed!';
        }
    } else {
        // audio.src = URL.createObjectURL(audioBlob);
    }

    audio.src = URL.createObjectURL(audioBlob);
    console.log(audio);

    statusDisplay.innerText = '';
}

function selectRandomMedia() {
    const index = Math.floor(Math.random() * futureList.length);
    const result = futureList[index];
    futureList.splice(index, 1);
    console.log(futureList);
    return result;
}

async function getLocalFile(filename) {
    console.log(filename);
    const audioBlob = await getStoredItem('files', filename, 'blob');
    console.log('stored:', audioBlob);
    return audioBlob;
}

async function getRemoteFile(filename) {
    console.log(filename);
    const audioBlob = await fetchBlob(filename);
    console.log('fetched:', audioBlob);
    if (audioBlob) {
        storeItem('files', { filename, blob: audioBlob });
    } else {
        statusDisplay.innerText = 'Load failed!';
    }
    return audioBlob;
}

let fetchCandidate = null;

async function tryAndFindAvailable() {
    let candidate = null;
    for(let tries = 0; tries < 10; tries++) {
        candidate = selectRandomMedia();
        const blob = await getLocalFile(candidate);
        if (!blob) {
            console.log('Nothing!');
            fetchCandidate = candidate;
        }

        return { media: candidate, blob };
    }

    return null;
}

export async function choseNext(play = false) {
    if(nextMedia) {
        currentMedia = nextMedia;
        await setSrc(currentMedia);
    } else {
        const local = await tryAndFindAvailable();
        if (local) {
            filenameDisplay.innerText = local.media;
            audio.src = URL.createObjectURL(local.blob);
            console.log(audio);
        } else {
            filenameDisplay.innerText = fetchCandidate;
            const blob = await getRemoteFile(fetchCandidate);
            audio.src = URL.createObjectURL(blob);
            console.log(audio);
        }
    }

    if (play) audio.play();
}

export async function chosePrevisous(play = false) {
    listIndex--;
    if(listIndex < 0) listIndex = filenames.length - 1;
    await setSrc(filenames[listIndex]);

    if (play) audio.play();
}