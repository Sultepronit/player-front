import formateSeconds from '../helpers/formateSeconds';
import setPause from '../helpers/setPause';
import { audio, filenameDisplay, statusDisplay } from '../main';
import { fetchBlob, fetchWithFeatures } from '../services/api';
import { getStoredItem, storeItem } from "../services/localDbHandlers";
import { restoreTime, saveTime } from '../services/timeSaver';
import { updatePlaylistView } from './playlistDisplay';
import { durationDisplay } from './uiControls';

let playlist = [];
let history = {
    past: [],
    future: [],
    inPast: 0,
}

setInterval(() => saveTime(), 30 * 1000);

function startFromScratch() {
    history.future.push(...playlist.keys());
    localStorage.setItem('history', JSON.stringify(history));
    choseNext(false);
}

async function updatePlayList() {
    const newPlaylist = await fetchWithFeatures('/list');
    console.log('updated playlist:', newPlaylist);

    if (newPlaylist.length > playlist.length) {
        // const newMediaIndexes = [...newPlaylist.keys()].slice(playlist.length);
        // console.log('new indexes:', newMediaIndexes);
        // history.future.push(...newMediaIndexes);
        history.future = [...newPlaylist.keys()]
            .filter((index) => !history.past.includes(index));
        console.log(history);
        localStorage.setItem('history', JSON.stringify(history));
    }

    playlist = newPlaylist;
    updatePlaylistView(newPlaylist);
    storeItem('details', { id: 'details', data: newPlaylist });
}

export async function startSession() {
    playlist = await getStoredItem('details', 'details', 'data');
    console.log(playlist);
    updatePlaylistView(playlist);
    console.timeLog('t', 'Restored playlist(?)');

    if (playlist) {
        const restoredHistory = JSON.parse(localStorage.getItem('history'));
        console.log(restoredHistory);
        // const savedHistory = null;
        if (restoredHistory?.past.length) {
            // document.getElementById('status').innerText = savedHistory;
            history = restoredHistory;
            history.inPast++;
            chosePrevious(false);
            restoreTime();

            // document.getElementById('msg').innerText = history.future;
        } else {
            startFromScratch();
        }

        updatePlayList();
    } else {
        playlist = await fetchWithFeatures('/list');

        startFromScratch();

        storeItem('details', { id: 'details', data: playlist });
    }

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

    const mediaIndex = history.future[Math.floor(Math.random() * history.future.length)];
    const mediaInfo = playlist[mediaIndex];

    const mediaFile = await getLocalFile(mediaInfo.filename);
    if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };

    // immediately fetching the unavailable file for more or less near future
    getRemoteFile(mediaInfo.filename).then(file => freshLoadedFile = file);

    // trying to find available file through all the list
    console.log('searching for available file');
    for (const mediaIndex of history.future) {
        const mediaInfo = playlist[mediaIndex];

        const mediaFile = await getLocalFile(mediaInfo.filename);
        if(mediaFile) return { mediaIndex, mediaInfo, mediaFile };
    }

    // if nothing found, the only way is to wait for our first file, to be available
    console.log('waiting for the file to be available');
    while(!freshLoadedFile) {
        await setPause(300);
    }
    
    return { mediaIndex, mediaInfo, mediaFile: freshLoadedFile };
}

function setMedia({ mediaInfo, mediaFile }, play = true) {
    const { id, originalFilename } = mediaInfo;

    audio.src = URL.createObjectURL(mediaFile);
    if (play) audio.play();

    filenameDisplay.innerText = `${id}: ${originalFilename}`;
    setTimeout(() => durationDisplay.innerText = formateSeconds(audio.duration), 300);

    console.log(history);
    // document.getElementById('msg').innerText = history.future;
    localStorage.setItem('history', JSON.stringify(history));
}

let prepared = null;
export async function choseNext(play = true) {    
    if (history.inPast < 0) return playAgainNext();

    const media = prepared ? prepared : await tryAndFindAvailable();
    console.log(media);

    history.future = history.future.filter(index => index !== media.mediaIndex);
    history.past.push(media.mediaIndex);
    if (history.past.length > history.future.length) {
        history.future.push(history.past.shift());
    }

    setMedia(media, play);

    prepared = null;
    prepared = await tryAndFindAvailable();
    console.log('prepared next media');
}

export async function chosePrevious(play = true) {
    if (history.past.length + history.inPast < 2) return;

    const mediaInfo = playlist[
        history.past[--history.inPast + history.past.length - 1]
    ];
    const mediaFile = await getLocalFile(mediaInfo.filename);

    setMedia({ mediaInfo, mediaFile }, play);
}

async function playAgainNext() {
    const mediaInfo = playlist[
        history.past[++history.inPast + history.past.length - 1]
    ];
    const mediaFile = await getLocalFile(mediaInfo.filename);

    setMedia({ mediaInfo, mediaFile });
}