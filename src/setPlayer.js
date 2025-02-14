import { audio, choseManually, choseNext, chosePrevious, updatePlayList } from "./playbackHandlers";
import { saveTime } from "../services/timeSaver";
import formateSeconds from "../helpers/formateSeconds";
import { changeRating, changeVolume as changeTrackVolume } from "./currentMedia";

export default function setPlayer() {
    // html elements
    const timeDisplay = document.getElementById('time');
    const progressBar = document.getElementById('progressBar');
    const volumeControl = document.getElementById('volume');
    const trackVolumeControl = document.getElementById('track-volume');

    // progresss 
    audio.addEventListener('timeupdate', () => {
        const improvedDuration = audio.duration || 0; // can be NaN
  
        timeDisplay.innerText
            = `${formateSeconds(audio.currentTime)} / ${formateSeconds(improvedDuration)}`;

        progressBar.value = audio.currentTime / audio.duration * 1000 || 0;   
    });

    progressBar.addEventListener('input', () => {
        audio.currentTime = progressBar.value / 1000 * audio.duration;
    });

    // buttons
    let isPlaying = false;
    function playManually() {
        audio.play();
        updatePlayList();
    }

    function playPause() {
        isPlaying ? audio.pause() : playManually();
    }

    const playButton = document.getElementById('play-button');
    playButton.addEventListener('click', playPause);

    audio.addEventListener('play', () => {
        isPlaying = true;
        playButton.innerText = '⏸️';
        saveTime();
        // updatePlayList();
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

    document.getElementById('uprade-rating').addEventListener('click', () => {
        changeRating(5);
    });

    document.getElementById('degrade-rating').addEventListener('click', () => {
        changeRating(-5);
    });

    // volume

    // const audioCtx = new AudioContext();
    // const source = audioCtx.createMediaElementSource(audio);
    // const gainNode = audioCtx.createGain();
    // source.connect(gainNode);
    // gainNode.connect(audioCtx.destination);
    // gainNode.gain.value = 4;

    volumeControl.value = localStorage.getItem('volume') || 70;
    // let volume = localStorage.getItem('volume') || 70;

    function setVolume() {
        // console.log(volume, trackVolumeControl.value)
        const inputVolume = volumeControl.value * trackVolumeControl.value / 10000;
        // console.log(inputVolume);
        // audio.volume = volume / 100;
        audio.volume = inputVolume > 1 ? 1 : inputVolume;
        // gainNode.gain.value = inputVolume > 1 ? inputVolume : 1;
    }
    setVolume();

    // volumeControl.value = volume;
    volumeControl.addEventListener('input', () => {
        // volume = volumeControl.value;
        localStorage.setItem('volume', volumeControl.value);
        setVolume();
    });

    trackVolumeControl.addEventListener('jsInput', setVolume);

    trackVolumeControl.addEventListener('input', () => {
        changeTrackVolume(trackVolumeControl.value);
        setVolume();
    });

    // navigator
    if ('mediaSession' in navigator) {
        // navigator.mediaSession.playbackState = 'playing'; // should prevents video from stopping
        navigator.mediaSession.setActionHandler('play', () => playManually());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => chosePrevious());
        navigator.mediaSession.setActionHandler('nexttrack', () => choseNext());
    }

    // keyboard
    document.addEventListener('keyup', (e) => {
        // console.log(e.code);
        switch(e.code) {
            case 'Space':
                playPause();
                break;
            case 'KeyN':
                choseNext();
                break;
            case 'KeyB':
                chosePrevious();
                break;
        }
    });

    // global listener
    let selectedTrackElement = null;
    document.addEventListener('click', (e) => {
        if (selectedTrackElement !== e.target) {
            selectedTrackElement?.classList.remove('selected-track');

            if (e.target?.id.startsWith('track-')) {
                selectedTrackElement = e.target;
                e.target.classList.add('selected-track');
            }
        } else {
            const id = e.target.id.replace('track-', '');
            choseManually(id);
        }
    });
}
