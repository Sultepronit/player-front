import './style.css';
import { uploadFiles } from './services/uploadHandlers';
import { startSession, chosePrevious, choseNext } from './src/playbackHandlers';
import formateSeconds from './helpers/formateSeconds';
import { saveTime } from './services/timeSaver';

console.time('t');

const audio = new Audio();

const timeDisplay = document.getElementById('time');
const progressBar = document.getElementById('progressBar');
const filenameDisplay = document.getElementById('filename');
const statusDisplay = document.getElementById('status');
const volumeControl = document.getElementById('volume');

startSession();

audio.onended = () => choseNext(true);

audio.addEventListener('timeupdate', () => {
    const improvedDuration = audio.duration || 0; // can be NaN

    progressBar.value = (audio.currentTime / improvedDuration) * 1000;

    const currentTime = formateSeconds(audio.currentTime);
    timeDisplay.innerText = `${currentTime}`;
});

progressBar.addEventListener('input', () => {
    audio.currentTime = progressBar.value / 1000 * audio.duration;
});

let isPlaying = false;

const playButton = document.getElementById('play-button');
playButton.addEventListener('click', () => {
    isPlaying ? audio.pause() : audio.play();
});

audio.addEventListener('play', () => {
    isPlaying = true;
    playButton.innerText = '⏸️';
    saveTime();
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    playButton.innerText = '▶️';
    saveTime();
});

document.getElementById('prev-button')
    .addEventListener('click', async () => chosePrevious(true));

document.getElementById('next-button')
    .addEventListener('click', async () => choseNext(true));

let volume = localStorage.getItem('volume') || 70;
function setVolume() {
    audio.volume = volume / 100;
}
setVolume();

volumeControl.value = volume;
volumeControl.addEventListener('input', (e) => {
    setVolume(volume = e.target.value);
    localStorage.setItem('volume', volume);
});

document.getElementById('uploadForm').addEventListener('submit', uploadFiles);

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => chosePrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => choseNext());
}

export { audio, filenameDisplay, statusDisplay };