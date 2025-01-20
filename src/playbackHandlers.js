import { fetchWithFeatures } from '../services/api';
import { fetchAndStoreRemoteFile, getLocalFile, tryAndFindAvailable } from '../services/audioFilesHandlers';
import { getStoredItem, storeItem } from "../services/localDbHandlers";
import { restoreTime, saveTime } from '../services/timeSaver';
import displayMediaInfo from './displayMediaInfo';
import { addMessage } from './handleMessages';
import { updatePlaylistView } from './playlistDisplay';

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

async function updatePlayList() {
    const newPlaylist = await fetchWithFeatures('/list');
    console.log('updated playlist:', newPlaylist);

    if (newPlaylist.length > playlist.length) {
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
            history = restoredHistory;
            history.inPast++;

            chosePrevious(false);
            restoreTime();
        } else {
            startFromScratch();
        }

        updatePlayList();
    } else {
        playlist = await fetchWithFeatures('/list');

        updatePlaylistView(playlist);

        storeItem('details', { id: 'details', data: playlist });

        startFromScratch();
    }

    console.timeLog('t', 'Starting playback...');
    exportFiles();
}

async function exportFiles() {
    // const exportUrl = import.meta.env.VITE_EXPORT_URL;
    console.log('export!');
    console.log(playlist);

    const exportUrl = prompt('url, please!');
    console.log(exportUrl);


    // const filename = '9.mp3';
    // const blob = await getStoredItem('files', filename, 'blob');
    // console.log(blob);

    // try {
    //     const formData = new FormData();
    //     formData.append('file', blob, filename);
    //     const result = await fetchWithFeatures('/import', 'POST', 'text', formData, exportUrl);
    //     console.log(result);
    // } catch (error) {
    //     console.warn(error);
    // }

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

        if (counter++ > 5) {
            counter = 0;
            alert('continue?');
        }
    }
}

async function setMedia({ mediaInfo, mediaFile }, play = true) {
    console.log('setting:', mediaInfo, mediaFile );
    // const { id, originalFilename } = mediaInfo;
    displayMediaInfo(mediaInfo);

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