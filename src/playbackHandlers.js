// import { fetchWithFeatures } from '../services/api';
import { fetchAndStoreRemoteFile, getLocalFile, findAvailable } from './services/audioFilesHandlers';
import { backupPlaylist, restoreFilesList, resotrePlaylist as restorePlaylist } from "./services/localDbHandlers";
import { restoreTime, saveTime } from '../services/timeSaver';
import { changeRating, setCurrentMedia } from './currentMedia';
import { addMessage } from './handleMessages';
import { updatePlaylistView, displayNewAvailable } from './playlistDisplay';
import { getCollection } from './services/api/firestore';
// import { uploadBlob } from './services/api/storage';
import { exportFiles } from './temp/export';
import setPause from '../helpers/setPause';

const audio = new Audio();
audio.onended = () => choseNext(true);

setInterval(() => saveTime(), 10 * 1000);

let playlist = [];
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

ratingInput.addEventListener('change', updateRatingList);

function saveHistory() {
    localStorage.setItem('history3', JSON.stringify(history3));
}

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

async function getRemoteFile(trackInfo = null, fetchAnyway = false) {
    if (!wantedFiles.length) return;

    let wantedIndex = 0;
    if (trackInfo) {
        wantedIndex = wantedFiles.findIndex(e => e === trackInfo.id)
    } else {
        wantedIndex = Math.floor(Math.random() * wantedFiles.length);
        trackInfo = wantedFiles[wantedIndex];
        console.log(trackInfo);
    }

    const success = await fetchAndStoreRemoteFile(trackInfo.filename, fetchAnyway);
    if (success) {
        wantedFiles.splice(wantedIndex, 1);
        localFiles.push(trackInfo.id);
        console.log(wantedFiles, localFiles);

        displayNewAvailable(trackInfo.id);

        if (localFiles.length < 5) getRemoteFile();
    }
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
        saveHistory();
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
    saveHistory();
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
    saveHistory();
}

async function setTrack(info, play = true) {
    console.log('setting:', info);
    
    setCurrentMedia(info);

    try {
        const blob = await getLocalFile(info.filename);

        URL.revokeObjectURL(audio.src);
        audio.src = URL.createObjectURL(blob);

        if (play) await audio.play();

        updateHistory(info.id - 1);
    } catch (error) {
        addMessage(error.message);
    }
}

let isBusy = false;
export async function choseNext(play = true, ratingIsOk = false) {
    getRemoteFile();

    if (history3.at > 1) return playAgainNext();

    if (play && !ratingIsOk) {
        changeRating(audio.currentTime < 60 ? -4 : 1);
    }

    if (isBusy) {
        addMessage('Please, wait a bit!');
        return;
    }

    isBusy = true;
    const trackInfo = await findAvailable(playlist, history3, localFiles);
    isBusy = false;

    setTrack(trackInfo, play);
}

export async function chosePrevious(play = true) {
    if (history3.at >= history3.recycle) return;

    const trackInfo = playlist[
        history3.set[history3.set.length - ++history3.at]
    ];
    console.log(history3);

    setTrack(trackInfo, play);
}

async function playAgainNext() {
    const trackInfo = playlist[
        history3.set[history3.set.length - --history3.at]
    ];

    setTrack(trackInfo);
}

export async function choseManually(id) {
    history3.at = 1;
     
    const trackIndex = id - 1;
    const trackInfo = playlist[trackIndex];
    console.log('manually:', trackInfo);

    for(let i = 0; i < 100; i++) {
        const isAvailable = localFiles.includes(trackInfo.id);

        if (isAvailable) {
            break;
        } else if (i < 1) {
            getRemoteFile(trackInfo, true);
        }

        console.log('waiting...');
        await setPause(500);
    }

    setTrack(trackInfo, true);
}

export { audio };