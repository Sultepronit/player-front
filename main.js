import './style.css';
import { uploadFiles } from './services/uploadHandlers';
import startSession, { chosePrevisous, choseNext } from './startSession';
import { audio } from './startSession';

console.time('t');

// const audio = document.getElementById('the-audio');

startSession();

let isPlaying = false;

const playButton = document.getElementById('play-button');
// playButton.addEventListener('click', () => audio.play());
// const stopButton = document.getElementById('stop-button');
// stopButton.addEventListener('click', () => audio.pause());
playButton.addEventListener('click', () => {
    isPlaying ? audio.pause() : audio.play();
});


audio.addEventListener('play', () => {
    isPlaying = true;
    playButton.innerText = 'stop';
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    playButton.innerText = 'play';
});

document.getElementById('prev-button')
    .addEventListener('click', async () => chosePrevisous(true));

document.getElementById('next-button')
    .addEventListener('click', async () => choseNext(true));


document.getElementById('uploadForm').addEventListener('submit', uploadFiles);

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => chosePrevisous(true));
    navigator.mediaSession.setActionHandler('nexttrack', () => choseNext(true));
}