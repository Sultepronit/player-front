import { audio, choseNext, chosePrevious } from "./playbackHandlers";
import { saveTime } from "../services/timeSaver";
import formateSeconds from "../helpers/formateSeconds";

export default function setPlayer() {
    // html elements
    const timeDisplay = document.getElementById('time');
    const progressBar = document.getElementById('progressBar');
    const volumeControl = document.getElementById('volume');

    // progresss 
    let lastTime = 0;
    audio.addEventListener('timeupdate', () => {
        const improvedDuration = audio.duration || 0; // can be NaN

        // if (lastTime + 0.5 <= audio.currentTime) {
        //     lastTime = audio.currentTime;

        //     timeDisplay.innerText
        //         = `${formateSeconds(audio.currentTime)} / ${formateSeconds(improvedDuration)}`;

        //     progressBar.value = audio.currentTime / audio.duration * 1000 || 0;
        // }         
        timeDisplay.innerText
            = `${formateSeconds(audio.currentTime)} / ${formateSeconds(improvedDuration)}`;

        progressBar.value = audio.currentTime / audio.duration * 1000 || 0;   
    });

    progressBar.addEventListener('input', () => {
        audio.currentTime = progressBar.value / 1000 * audio.duration;
    });

    // buttons
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

    // nvigator

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => chosePrevious());
        navigator.mediaSession.setActionHandler('nexttrack', () => choseNext());
    }

    // volume

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
}