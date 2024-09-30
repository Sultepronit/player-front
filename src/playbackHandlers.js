import setPause from '../helpers/setPause';
import { audio, filenameDisplay, statusDisplay } from '../main';
import { fetchBlob, fetchWithFeatures } from '../services/api';
import { getStoredItem, storeItem } from "../services/localDbHandlers";
import updateFilenames from "../services/updateFilenames";

// let filenames = [];
let playlist = [];
// let listIndex = -1;
const pastList = [];
// let currentMedia = null;
// let nextMedia = null;
let futureList = [];


export async function startSession() {
    // filenames = await getStoredItem('filenames', 'filenames', 'data');
    playlist = await getStoredItem('details', 'details', 'data');
    console.log(playlist);
    console.timeLog('t', 'Restored playlist(?)');

    if(!playlist) {
        playlist = await fetchWithFeatures('/list');
        storeItem('details', { id: 'details', data: playlist });
    } else {
        fetchWithFeatures('/list').then(newPlaylist => {
            if (newPlaylist.length !== playlist?.length) {
                storeItem('details', { id: 'details', data: newPlaylist });
            } 
        })
    }

    futureList.push(...playlist.keys());
    console.log(futureList);

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

async function tryAndFindAvailable() {
    let freshLoadedFile = null;

    const mediaIndex = futureList[Math.floor(Math.random() * futureList.length)];
    const mediaInfo = playlist[mediaIndex];

    const mediaFile = await getBlob(mediaInfo.filename);
    if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };

    // immediately fetching the unavailable file for more or less near future
    getBlob(mediaInfo.filename, true).then(file => freshLoadedFile = file);

    // trying to find available file through all the list
    console.log('searching for awailable file');
    for (const mediaIndex of futureList) {
        const mediaInfo = playlist[mediaIndex];

        const mediaFile = await getBlob(mediaInfo.filename);
        if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };
    }

    // if nothing found, the only way is to wait for our first file, to be available
    console.log('waiting for the file to be awailable');
    while(!freshLoadedFile) {
        setPause(300);
    }
    
    return { mediaIndex, mediaInfo, mediaFile: freshLoadedFile };
}

function setMedia({ mediaIndex, mediaInfo, mediaFile }, play = false) {
    futureList = futureList.filter(index => index !== mediaIndex);
    pastList.push(mediaIndex);
    if (pastList.length > futureList.length) {
        futureList.push(pastList.shift());
    }
    console.log(futureList);
    console.log(pastList);

    const { id, originalFilename } = mediaInfo;
    filenameDisplay.innerText = `${id}: ${originalFilename}`;

    audio.src = URL.createObjectURL(mediaFile);
    if (play) audio.play();
}

let prepared = null;
export async function choseNext(play = false) {    
    const media = prepared ? prepared : await tryAndFindAvailable();
    console.log(media);

    setMedia(media, play);

    prepared = null;
    prepared = await tryAndFindAvailable();
}

export async function chosePrevisous(play = false) {
//     listIndex--;
//     if(listIndex < 0) listIndex = filenames.length - 1;
//     await setSrc(filenames[listIndex]);

//     if (play) audio.play();
}