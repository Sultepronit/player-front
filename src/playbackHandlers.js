import setPause from '../helpers/setPause';
import { audio, filenameDisplay, statusDisplay } from '../main';
import { fetchBlob, fetchWithFeatures } from '../services/api';
import { getStoredItem, storeItem } from "../services/localDbHandlers";

let playlist = [];
const pastList = [];
let futureList = [];

export async function startSession() {
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

    choseNext(false);
    console.timeLog('t', 'Starting playback...');
}

async function getLocalFile(filename) {
    console.log('filename:', filename);
    const audioBlob = await getStoredItem('files', filename, 'blob');
    console.log('local:', audioBlob);
    return audioBlob;
}

async function getRemoteFile(filename) {
    console.log('filename:', filename);
    const audioBlob = await fetchBlob(filename);
    console.log('fetched:', audioBlob);
    if (audioBlob) {
        storeItem('files', { filename, blob: audioBlob });
    } else {
        statusDisplay.innerText = 'Load failed!';
    }
    return audioBlob;
}

async function tryAndFindAvailable() {
    let freshLoadedFile = null;

    const mediaIndex = futureList[Math.floor(Math.random() * futureList.length)];
    const mediaInfo = playlist[mediaIndex];

    const mediaFile = await getLocalFile(mediaInfo.filename);
    if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };

    // immediately fetching the unavailable file for more or less near future
    getRemoteFile(mediaInfo.filename).then(file => freshLoadedFile = file);

    // trying to find available file through all the list
    console.log('searching for awailable file');
    for (const mediaIndex of futureList) {
        const mediaInfo = playlist[mediaIndex];

        const mediaFile = await getLocalFile(mediaInfo.filename);
        if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };
    }

    // if nothing found, the only way is to wait for our first file, to be available
    console.log('waiting for the file to be awailable');
    while(!freshLoadedFile) {
        await setPause(300);
    }
    
    return { mediaIndex, mediaInfo, mediaFile: freshLoadedFile };
}

function setMedia({ mediaInfo, mediaFile }, play = true) {
    const { id, originalFilename } = mediaInfo;
    filenameDisplay.innerText = `${id}: ${originalFilename}`;

    audio.src = URL.createObjectURL(mediaFile);
    if (play) audio.play();
}

let inPast = 0;
let prepared = null;
export async function choseNext(play = true) {    
    if (inPast < 0) return playAgainNext();

    const media = prepared ? prepared : await tryAndFindAvailable();
    console.log(media);

    futureList = futureList.filter(index => index !== media.mediaIndex);
    pastList.push(media.mediaIndex);
    if (pastList.length > futureList.length) {
        futureList.push(pastList.shift());
    }
    console.log(futureList);
    console.log(pastList);

    setMedia(media, play);

    prepared = null;
    prepared = await tryAndFindAvailable();
    console.log('prepared next media');
}

export async function chosePrevisous() {
    if (pastList.length + inPast < 2) return;

    const mediaInfo = playlist[
        pastList[--inPast + pastList.length - 1]
    ];
    const mediaFile = await getLocalFile(mediaInfo.filename);

    setMedia({ mediaInfo, mediaFile });
}

async function playAgainNext() {
    const mediaInfo = playlist[
        pastList[++inPast + pastList.length - 1]
    ];
    const mediaFile = await getLocalFile(mediaInfo.filename);

    setMedia({ mediaInfo, mediaFile });
}