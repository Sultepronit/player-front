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

export async function startSession() {
    playlist = await getStoredItem('details', 'details', 'data');
    console.log(playlist);
    updatePlaylistView(playlist || []);
    console.timeLog('t', 'Restored playlist(?)');

    if (!playlist) {
        playlist = await fetchWithFeatures('/list');
        storeItem('details', { id: 'details', data: playlist });
    } else {
        fetchWithFeatures('/list').then(newPlaylist => {
            console.log(newPlaylist);

            if (newPlaylist.length > playlist.length) {
                const newMediaIndexes = [...newPlaylist.keys()].slice(playlist.length);
                console.log(newMediaIndexes);
                history.future.push(...newMediaIndexes);
            }

            playlist = newPlaylist;
            updatePlaylistView(newPlaylist);
            storeItem('details', { id: 'details', data: newPlaylist });
        })
    }

    // const savedHistory = localStorage.getItem('history');
    const savedHistory = null;
    if (savedHistory) {
        document.getElementById('status').innerText = (savedHistory);
        history = JSON.parse(savedHistory);
        history.inPast++;
        chosePrevious(false);
        restoreTime();
    } else {
        history.future.push(...playlist.keys());
        choseNext(false);
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