import './style.css';
// import fetchBlob from './fetchBlob';
// import { getFile, saveFile } from './localDbHandlers';
import { uploadFiles } from './services/uploadHandlers';
import startSession, { chosePrevisous } from './startSession';
import { audio } from './startSession';

console.time('t');

// const audio = document.getElementById('the-audio');

startSession();

let isPlaying = false;

const playButton = document.getElementById('play-button');
// playButton.addEventListener('click', () => audio.play());
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

// const stopButton = document.getElementById('stop-button');
// stopButton.addEventListener('click', () => audio.pause());

document.getElementById('prev-button')
    .addEventListener('click', async () => chosePrevisous(true));


document.getElementById('uploadForm').addEventListener('submit', uploadFiles);
