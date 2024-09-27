import fetchBlob from './fetchBlob';
import { getFile, saveFile } from './localDbHandlers';
import './style.css';
import { uploadFiles } from './uploadHandlers';

console.time('t');

const audio = document.getElementById('the-audio');

const urls = [
    '01%20-%20Misaki%20Meguri.mp3',
    '11%20-%20Kaeru%20kara%20%28Guitar%20Version%29.mp3',
];

let currentId = 0;
async function setNextSrc() {
    const blob = await getFile(currentId);
    audio.src = URL.createObjectURL(blob);
    // playBlob(blob);
    console.log(blob);
    console.log(audio);

    currentId++;
    if(currentId >= urls.length) currentId = 0;
}

const dbIsPopulated = localStorage.getItem('dbIsPopulated');
if(dbIsPopulated) {
    console.log('setNextSrc');
    setNextSrc();
    // audio.src = 'https://zc7q17r5-5500.euw.devtunnels.ms/';
    // audio.src = 'http://localhost:5500';
    console.log(audio);
} else {
    console.log('populate');
    for(let i = 0; i < urls.length; i++) {
        // const blob = await fetchBlob(urls[i]);
        // await saveFile(i, blob);
        fetchBlob(urls[i]).then(blob => {
            saveFile(i, blob);
        })
    }
    localStorage.setItem('dbIsPopulated', true);
    // location.reload();
    console.log('reload?...')
}



// const audio = new Audio();
// const audio = document.getElementById('the-video');

// const blob = await fetchBlob('01%20-%20Misaki%20Meguri.mp3');
// const audioUrl = playBlob(blob);

// audio.src = audioUrl;

// const audio2 = new Audio();
// audio2.src = '11%20-%20Kaeru%20kara%20%28Guitar%20Version%29.mp3';

let volume = 70;
function setVolume(volume) {
    audio.volume = volume / 100;
}
setVolume(volume);

let isPaused = false;

function pause() {
    return new Promise((resolve) => {
        let faidingVolume = volume;
        const iid = setInterval(() => {
            setVolume(faidingVolume *= 0.6);
            if(faidingVolume <= 1) {
                clearInterval(iid);
                audio.pause();
                audio.currentTime--;
                resolve('paused!');
            }
            console.log(faidingVolume);
        }, 100);
        isPaused = true;
    });
}

function play() {
    audio.play();
    if(!isPaused) return;

    let increasingVolume = 1;
    const iid = setInterval(() => {
        increasingVolume /= 0.6;
        if(increasingVolume >= volume) {
            setVolume(volume);
            clearInterval(iid);
            return;
        }
        setVolume(increasingVolume);
        console.log(increasingVolume);
    }, 100);
    isPaused = false;
}

async function playNext() {
    await pause();
    // audio.src = '11%20-%20Kaeru%20kara%20%28Guitar%20Version%29.mp3';
    await setNextSrc();
    play();
}

const playButton = document.getElementById('play-button');
playButton.addEventListener('click', play);

const stopButton = document.getElementById('stop-button');
stopButton.addEventListener('click', pause);

document.getElementById('next-button').addEventListener('click', playNext);

const volumeControl = document.getElementById('volume');
volumeControl.value = volume;
volumeControl.addEventListener('input', (e) => {
    // volume = e.target.value;
    setVolume(volume = e.target.value);
});

const statusElement = document.getElementById('status');

document.getElementById('uploadForm').addEventListener('submit', uploadFiles);

// audio.addEventListener('timeupdate', () => {
//     // console.log(audio.currentTime);
//     if (navigator.mediaSession.setPositionState) {
//         // console.log(audio.currentTime);
//         navigator.mediaSession.setPositionState({
//             duration: audio.duration || 0,
//             playbackRate: audio.playbackRate,
//             position: audio.currentTime
//         });
//     }
// });

if ('mediaSession' in navigator) {
    // Set the metadata (title, artist, etc.) for the notification
    // navigator.mediaSession.metadata = new MediaMetadata({
    //     title: 'My Audio Title',
    //     artist: 'Artist Name',
    //     album: 'Album Name',
    //     artwork: [
    //         { src: 'cover.jpg', sizes: '96x96', type: 'image/jpg' },
    //         { src: 'cover.jpg', sizes: '128x128', type: 'image/jpg' },
    //         { src: 'cover.jpg', sizes: '192x192', type: 'image/jpg' }
    //     ]
    // });

    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('Previous track button clicked');
        statusElement.innerText = 'Previous track button clicked';
    });

    // navigator.mediaSession.setActionHandler("seekbackward", () => {
    //     console.log('seekbackward button clicked');
    //     statusElement.innerText = 'seekbackward button clicked';
    // });

    // navigator.mediaSession.setActionHandler("seekforward", () => {
    //     console.log('seekforward button clicked');
    //     statusElement.innerText = 'seekforward button clicked';
    // });

    // navigator.mediaSession.setActionHandler("seekbackward", null);
    // navigator.mediaSession.setActionHandler("seekforward", null);


    // You can also handle seeking
    // navigator.mediaSession.setActionHandler('seekto', (event) => {
    //     if (event.fastSeek && 'fastSeek' in audio) {
    //         audio.fastSeek(event.seekTime);
    //     } else {
    //         audio.currentTime = event.seekTime;
    //     }
    // });

    // console.log(navigator.mediaSession);


    // audio.addEventListener('play', () => {
    //     navigator.mediaSession.playbackState = 'playing';
    // });
    
    // audio.addEventListener('pause', () => {
    //     navigator.mediaSession.playbackState = 'paused';
    // });
    
    // Update the position and duration for the notification progress bar

    // function updatePositionState() {
    //     navigator.mediaSession.setPositionState({
    //       duration: audio.duration,
    //       playbackRate: audio.playbackRate,
    //       position: audio.currentTime,
    //     });
    //   }      

    // navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    //     const skipTime = details.seekOffset || 10;
    //     console.log(skipTime);

    //     audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
    //     updatePositionState();
    // });

    // let counter = 0;
    // if (navigator.mediaSession.setPositionState) {
    //     setInterval(() => {
    //         statusElement.innerText = counter++;
    //         navigator.mediaSession.setPositionState({
    //             duration: audio.duration,
    //             // playbackRate: audio.playbackRate,
    //             position: audio.currentTime
    //         });
    //     }, 1000);
    // }
}

