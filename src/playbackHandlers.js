import { fetchWithFeatures } from '../services/api';
import { fetchAndStoreRemoteFile, getLocalFile, tryAndFindAvailable } from '../services/audioFilesHandlers';
import { backupPlaylist, getStoredItem, resotrePlaylist, storeItem } from "../services/localDbHandlers";
import { restoreTime, saveTime } from '../services/timeSaver';
import { getCurrentMedia, setCurrentMedia } from './currentMedia';
import { addMessage } from './handleMessages';
import { updatePlaylistView } from './playlistDisplay';
import { getCollection, setDocument } from './services/api/firestore';

const audio = new Audio();

audio.onended = () => choseNext(true);

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

export async function updatePlayList() {
    // const newPlaylist = await fetchWithFeatures('/list');
    const remotePlaylist = await getCollection('list-details');
    console.log('remote playlist:', remotePlaylist);

    if (remotePlaylist.length > playlist.length) {
        history.future = [...remotePlaylist.keys()]
            .filter((index) => !history.past.includes(index));
        console.log(history);
        localStorage.setItem('history', JSON.stringify(history));
    }

    const updates = remotePlaylist.filter((entry, index) => {
        for (const field of Object.keys(entry)) {
            if (!playlist[index]) return true;
            if (entry[field] !== playlist[index][field]) return true;
        }
        return false;
    });
    console.log('updates:', updates);

    if (!updates.length) return;

    playlist = remotePlaylist;
    updatePlaylistView(remotePlaylist);

    const currentMedia = getCurrentMedia();
    setCurrentMedia(playlist.find(entry => entry.id === currentMedia.id));

    // storeItem('details', { id: 'details', data: newPlaylist });
    // backupPlaylist(remotePlaylist);
    backupPlaylist(updates);
}

export async function startSession() {
    // playlist = await getStoredItem('details', 'details', 'data');
    playlist = await resotrePlaylist();
    console.log(playlist);
    updatePlaylistView(playlist);
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
            startFromScratch();
        }

        updatePlayList();
    } else {
        console.log('New start!');
        // playlist = await fetchWithFeatures('/list');
        const playlist = await getCollection('list-details');

        updatePlaylistView(playlist);

        // storeItem('details', { id: 'details', data: playlist });
        backupPlaylist(playlist);

        startFromScratch();
    }

    console.timeLog('t', 'Starting playback...');
    // exportFiles();
    // getCollection('list-details');
    // exportList();
}

async function exportList() {
    console.log('export!');
    console.log(playlist);
    for (const item of playlist) {
        console.log(item);
        await setDocument('list-details', String(item.id), {
            filename: item.filename,
            originalFilename: item.originalFilename,
            rating: 90
        });
    }
}

async function exportFiles() {
    // const exportUrl = import.meta.env.VITE_EXPORT_URL;
    console.log('export!');
    console.log(playlist);

    const exportUrl = prompt('url, please!');
    console.log(exportUrl);

    let counter = 0;
    for (const item of playlist) {
        console.log(item.filename);
        const blob = await getStoredItem('files', item.filename, 'blob');
        if (!blob) {
            console.warn('No file!');
            continue;
        }
        console.log(blob);

        try {
            const formData = new FormData();
            formData.append('file', blob, item.filename);
            const result = await fetchWithFeatures('/import', 'POST', 'text', formData, exportUrl);
            console.log(result);
        } catch (error) {
            console.warn(error);
        }

        if (counter++ > 10) {
            counter = 0;
            alert('continue?');
        }
    }
}

async function setMedia({ mediaInfo, mediaFile }, play = true) {
    console.log('setting:', mediaInfo, mediaFile );
    // const { id, originalFilename } = mediaInfo;
    setCurrentMedia(mediaInfo);

    try {
        if (mediaFile?.type.includes('text')) throw new Error('Wrong file type!');
        audio.src = URL.createObjectURL(mediaFile);   

        if (play) await audio.play();

        console.log(history);
        localStorage.setItem('history', JSON.stringify(history));
    } catch (error) { // no file is stored, or not a mediafile
        addMessage(
            `Get ${mediaFile?.type} instead of mediafile! <br>
            Trying to fetch it one more time.`
        );
        fetchAndStoreRemoteFile(mediaInfo.filename);
    }
}

let nextMedia = null;
let isBusy = false;
export async function choseNext(play = true) {
    if (history.inPast < 0) return playAgainNext();

    if (isBusy) {
        addMessage('Please, wait a bit!');
        return;
    }
    isBusy = true;

    if (!nextMedia) nextMedia = await tryAndFindAvailable(playlist, history.future);
    // console.log(nextMedia);

    history.future = history.future.filter(index => index !== nextMedia.mediaIndex);
    history.past.push(nextMedia.mediaIndex);

    if (history.past.length > history.future.length) {
        history.future.push(history.past.shift());
    }

    setMedia(nextMedia, play);

    nextMedia = null;
    isBusy = false;

    nextMedia = await tryAndFindAvailable(playlist, history.future);
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