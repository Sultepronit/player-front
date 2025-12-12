// import { fetchWithFeatures } from '../services/api';
import { fetchAndStoreRemoteFile, getLocalFile, getManuallySellected, tryAndFindAvailable } from './services/audioFilesHandlers';
import { backupPlaylist, getStoredItem, restoreFilesList, resotrePlaylist as restorePlaylist, storeItem } from "./services/localDbHandlers";
import { restoreTime, saveTime } from '../services/timeSaver';
import { changeRating, getCurrentMedia, setCurrentMedia } from './currentMedia';
import { addMessage } from './handleMessages';
import { updatePlaylistView } from './playlistDisplay';
import { getCollection, setDocument } from './services/api/firestore';
// import { uploadBlob } from './services/api/storage';
import { exportFiles } from './temp/export';

const audio = new Audio();
// console.log(audio);

audio.onended = () => choseNext(true);

let playlist = [];
let history = {
    past: [],
    future: [],
    inPast: 0,
}

let localFilesList = null;

const ratingFilteredDisplay = document.getElementById('rating-filtered');
const ratingInput = document.getElementById('rating');

function updateRatingDisplay() {
    const filtered = playlist.filter(entry => entry.rating >= ratingInput.value).length;
    ratingFilteredDisplay.innerText = `${ratingInput.value}: ${filtered}`;
}

ratingInput.addEventListener('change', updateRatingDisplay);

setInterval(() => saveTime(), 10 * 1000);

export async function updatePlayList() {
    // const newPlaylist = await fetchWithFeatures('/list');
    const remotePlaylist = await getCollection('list-details');
    remotePlaylist.sort((a, b) => a.id - b.id);
    console.log('remote playlist:', remotePlaylist);

    // if there is new entries update the future
    if (remotePlaylist.length > playlist.length) {
        history.future = [...remotePlaylist.keys()]
            .filter((index) => !history.past.includes(index));
        console.log(history);
        localStorage.setItem('history', JSON.stringify(history));
    }

    // check for entries changes
    const updates = remotePlaylist.filter((entry, index) => {
        for (const field of Object.keys(entry)) {
            if (!playlist[index]) return true;
            if (entry[field] !== playlist[index][field]) return true;
        }
        return false;
    });
    console.log('updates:', updates);

    if (!updates.length) return;

    // implement changes
    playlist = remotePlaylist;
    updatePlaylistView(playlist);

    // what the heck are we doing here???
    // const currentMedia = getCurrentMedia();
    // console.log(currentMedia);
    // setCurrentMedia(playlist.find(entry => entry.id === currentMedia.id));

    backupPlaylist(updates);
    updateRatingDisplay();
}

function createHistrory() {
    history.future.push(...playlist.keys());
    localStorage.setItem('history', JSON.stringify(history));
    choseNext(false);
}

async function initiateFilesList() {
    try {
        const filenames = await restoreFilesList();
        // console.log(filenames);
        localFilesList = filenames.map(n => n.split('.')[0]);
        console.log(localFilesList);
    } catch (error) {
        addMessage(error.message);
    }
    
}

// const devNotUpdate = import.meta.env.VITE_DEV_NOT_UPDATE;
export async function startSession() {
    initiateFilesList();

    playlist = await restorePlaylist();
    playlist.sort((a, b) => a.id - b.id);
    console.log(playlist);
    // updatePlaylistView(playlist);
    console.timeLog('t', 'Restored playlist');

    if (playlist && playlist.length) {
        const restoredHistory = JSON.parse(localStorage.getItem('history'));
        console.log(restoredHistory);
        // const savedHistory = null;
        if (restoredHistory?.past.length) {
            history = restoredHistory;

            history.inPast++;
            chosePrevious(false);

            restoreTime();
        } else {
            createHistrory();
        }

        if (!import.meta.env.VITE_DEV_NOT_UPDATE) updatePlayList();
    } else {
        console.log('New start!');
        // playlist = await fetchWithFeatures('/list');
        playlist = await getCollection('list-details');
        playlist.sort((a, b) => a.id - b.id);

        // updatePlaylistView(playlist);

        backupPlaylist(playlist);

        createHistrory();
    }

    updatePlaylistView(playlist, localFilesList);

    console.timeLog('t', 'Starting playback...');

    updateRatingDisplay();
}

async function setMedia({ mediaInfo, mediaFile }, play = true) {
    console.log('setting:', mediaInfo, mediaFile );
    // const { id, originalFilename } = mediaInfo;
    setCurrentMedia(mediaInfo);

    try {
        if (mediaFile?.type.includes('text')) throw new Error(`${mediaFile?.type} instead of mediafile!`);
        // addMessage(mediaFile);
        audio.src = URL.createObjectURL(mediaFile);   
        // addMessage(audio.src);

        // if (play) await audio.play();
        // if (play) audio.play();

        console.log(history);
        localStorage.setItem('history', JSON.stringify(history));

        if (play) await audio.play();
    } catch (error) { // no file is stored, or not a mediafile
        addMessage(error.message);
        if (mediaFile?.type.includes('text')) fetchAndStoreRemoteFile(mediaInfo.filename);
    }
}


function updateHistory(mediaIndex) {
    history.future = history.future.filter(index => index !== mediaIndex);
    history.past.push(mediaIndex);

    if (history.past.length > history.future.length) {
        history.future.push(history.past.shift());
    }
}

export async function choseManually(id) {
    history.inPast = 0;
     
    const trackIndex = id - 1;
    const trackInfo = playlist[trackIndex];
    console.log('manually:', trackInfo);
    const mediaFile = await getManuallySellected(trackInfo);

    updateHistory(trackIndex);
    setMedia({ mediaInfo: trackInfo, mediaFile }, true);
}

let isBusy = false;
export async function choseNext(play = true, ratingIsOk = false) {
    if (history.inPast < 0) return playAgainNext();

    if (play && !ratingIsOk) {
        changeRating(audio.currentTime < 60 ? -4 : 1);
    }

    if (isBusy) {
        addMessage('Please, wait a bit!');
        return;
    }

    isBusy = true;
    const nextMedia = await tryAndFindAvailable(playlist, history.future);
    isBusy = false;

    updateHistory(nextMedia.mediaIndex);

    console.log(nextMedia);
    if(nextMedia.pass) {
        return choseNext(play, true);
    }

    setMedia(nextMedia, play);
}

export async function chosePrevious(play = true) {
    if (history.past.length + history.inPast < 2) return;

    const mediaInfo = playlist[
        history.past[--history.inPast + history.past.length - 1]
    ];
    const mediaFile = await getLocalFile(mediaInfo.filename);
    console.log(mediaFile);

    setMedia({ mediaInfo, mediaFile }, play);
}

async function playAgainNext() {
    const mediaInfo = playlist[
        history.past[++history.inPast + history.past.length - 1]
    ];
    const mediaFile = await getLocalFile(mediaInfo.filename);

    setMedia({ mediaInfo, mediaFile });
}

export { audio };