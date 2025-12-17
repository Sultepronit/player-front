// import { fetchWithFeatures } from '../services/api';
import { fetchAndStoreRemoteFile, getLocalFile, getManuallySellected, findAvailable } from './services/audioFilesHandlers';
import { backupPlaylist, getStoredItem, restoreFilesList, resotrePlaylist as restorePlaylist, storeItem } from "./services/localDbHandlers";
import { restoreTime, saveTime } from '../services/timeSaver';
import { changeRating, getCurrentMedia, setCurrentMedia } from './currentMedia';
import { addMessage } from './handleMessages';
import { updatePlaylistView, displayNewAvailable } from './playlistDisplay';
import { getCollection, setDocument } from './services/api/firestore';
// import { uploadBlob } from './services/api/storage';
import { exportFiles } from './temp/export';

const audio = new Audio();
// console.log(audio);

audio.onended = () => choseNext(true);

setInterval(() => saveTime(), 10 * 1000);

let playlist = [];
// let history0 = {
//     past: [],
//     future: [],
//     inPast: 0,
// }
let history3 = {
    set: [],
    at: 1,
    recycle: 1
}

let localFiles = null;
let wantedFiles = [];
let ratedN = 0;

const ratingFilteredDisplay = document.getElementById('rating-filtered');
const ratingInput = document.getElementById('rating');

function updateRatingList() {
    const filtered = playlist.filter(entry => entry.rating >= ratingInput.value);
    ratedN = filtered.length;
    ratingFilteredDisplay.innerText = `${ratingInput.value}: ${ratedN}`;
    console.log('filtered:', filtered);
    if (localFiles.length === playlist.length) return;
    wantedFiles = filtered.filter(e => !localFiles.includes(e.id))
    console.log('wanted:', wantedFiles);

    getRemoteFile();
}

ratingInput.addEventListener('change', updateRatingList);

async function getRemoteFile() {
    if (!wantedFiles.length) return;
    const index = Math.floor(Math.random() * wantedFiles.length);
    const trackInfo = wantedFiles[index];
    console.log(trackInfo);

    const success = await fetchAndStoreRemoteFile(trackInfo.filename);
    if (success) {
        wantedFiles.splice(index, 1);
        localFiles.push(trackInfo.id);
        console.log(wantedFiles, localFiles);

        displayNewAvailable(trackInfo.id);
    }

    if (localFiles.length < 5) getRemoteFile();
}

export async function updatePlayList() {
    // const newPlaylist = await fetchWithFeatures('/list');
    const remotePlaylist = await getCollection('list-details');
    remotePlaylist.sort((a, b) => a.id - b.id);
    console.log('remote playlist:', remotePlaylist);

    // if there is new entries update the future
    if (remotePlaylist.length > playlist.length) {
        const newEntries = [];
        for (let i = playlist.length; i < remotePlaylist.length; i++) {
            newEntries.push(i);
        }
        history3.set.unshift(...newEntries);
        // history0.future = [...remotePlaylist.keys()]
        //     .filter((index) => !history0.past.includes(index));
        // console.log(history0);
        localStorage.setItem('history3', JSON.stringify(history3));
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
    // updatePlaylistView(playlist);
    updatePlaylistView(playlist, localFiles);

    // what the heck are we doing here???
    // const currentMedia = getCurrentMedia();
    // console.log(currentMedia);
    // setCurrentMedia(playlist.find(entry => entry.id === currentMedia.id));

    backupPlaylist(updates);
    updateRatingList();
}

function createHistory() {
    // history.future.push(...playlist.keys());
    history3.set.push(...playlist.keys());
    localStorage.setItem('history3', JSON.stringify(history3));
    choseNext(false);
}

async function initiateFilesList() {
    try {
        const filenames = await restoreFilesList();
        // console.log(filenames);
        localFiles = filenames.map(n => n.split('.')[0]);
        console.log(localFiles);
    } catch (error) {
        addMessage(error.message);
    }
}

export async function startSession() {
    initiateFilesList();

    playlist = await restorePlaylist();
    playlist.sort((a, b) => a.id - b.id);
    // console.log(playlist);
    // updatePlaylistView(playlist);
    console.timeLog('t', 'Restored playlist');

    if (playlist && playlist.length) {
        const restoredHistory = JSON.parse(localStorage.getItem('history3'));
        console.log(restoredHistory);
        if (restoredHistory?.at) {
            history3 = restoredHistory;

            // history.inPast++;
            history3.at--;
            chosePrevious(false);

            restoreTime();
        } else {
            createHistory();
        }
        // createHistory();

        if (!import.meta.env.VITE_DEV_NOT_UPDATE) updatePlayList();
    } else {
        console.log('New start!');
        // playlist = await fetchWithFeatures('/list');
        playlist = await getCollection('list-details');
        playlist.sort((a, b) => a.id - b.id);

        // updatePlaylistView(playlist);

        backupPlaylist(playlist);

        createHistory();
    }

    updatePlaylistView(playlist, localFiles);

    console.timeLog('t', 'Starting playback...');

    updateRatingList();

    getRemoteFile();
}

function updateHistory(mediaIndex) {
    const historyIndex = history3.set.findIndex(e => e === mediaIndex); // second time we are doing this!!!
    history3.set.splice(historyIndex, 1);
    history3.set.push(mediaIndex);

    if (history3.recycle < ratedN / 2) {
        history3.recycle++;
    } else if (history3.recycle > ratedN / 2) {
        history3.recycle = ratedN / 2;
    }

    console.log(history3);
    localStorage.setItem('history3', JSON.stringify(history3));
    // history0.future = history0.future.filter(index => index !== mediaIndex);
    // history0.past.push(mediaIndex);

    // if (history0.past.length > history0.future.length) {
    //     history0.future.push(history0.past.shift());
    // }
}

async function setTrack(info, play = true) {
    // console.log('setting:', mediaInfo, mediaFile );
    console.log('setting:', info);
    
    setCurrentMedia(info);

    try {
        const blob = await getLocalFile(info.filename);
        // if (mediaFile?.type.includes('text')) throw new Error(`${mediaFile?.type} instead of mediafile!`);
        // addMessage(mediaFile);
        URL.revokeObjectURL(audio.src);
        audio.src = URL.createObjectURL(blob);

        if (play) await audio.play();

        updateHistory(info.id - 1);
    } catch (error) { // no file is stored, or not a mediafile
        addMessage(error.message);
        // if (mediaFile?.type.includes('text')) fetchAndStoreRemoteFile(mediaInfo.filename);
    }
}

let isBusy = false;
export async function choseNext(play = true, ratingIsOk = false) {
    getRemoteFile();

    if (history3.at > 1) return playAgainNext();

    if (play && !ratingIsOk) {
        // changeRating(audio.currentTime < 60 ? -4 : 1);
    }

    if (isBusy) {
        addMessage('Please, wait a bit!');
        return;
    }

    isBusy = true;
    const trackInfo = await findAvailable(playlist, history3, localFiles);
    // console.log(nextMedia);
    isBusy = false;

    setTrack(trackInfo, play);
    // updateHistory(track.id - 1);
}

export async function chosePrevious(play = true) {
    // if (history.past.length + history.inPast < 2) return;
    if (history3.at >= history3.recycle) return;

    const trackInfo = playlist[
        // history.past[--history.inPast + history.past.length - 1]
        history3.set[history3.set.length - ++history3.at]
    ];
    console.log(history3);
    // const mediaFile = await getLocalFile(trackInfo.filename);
    // console.log(mediaFile);

    // setTrack({ mediaInfo: trackInfo, mediaFile }, play);
    setTrack(trackInfo, play);
}

async function playAgainNext() {
    const trackInfo = playlist[
        // history0.past[++history0.inPast + history0.past.length - 1]
        history3.set[history3.set.length - --history3.at]
    ];
    // const mediaFile = await getLocalFile(mediaInfo.filename);

    // setTrack({ mediaInfo, mediaFile });
    setTrack(trackInfo);
}

export async function choseManually(id) {
    // history0.inPast = 0;
    history3.at = 1;
     
    const trackIndex = id - 1;
    const trackInfo = playlist[trackIndex];
    console.log('manually:', trackInfo);
    // const mediaFile = await getManuallySellected(trackInfo);
    await getManuallySellected(trackInfo);

    // const mediaFile = await getLocalFile(trackInfo.filename);
    // setTrack({ mediaInfo: trackInfo, mediaFile }, true);
    // updateHistory(trackIndex);
    setTrack(trackInfo, true);
}

export { audio };