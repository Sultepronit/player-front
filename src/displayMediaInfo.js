const filenameDisplay = document.getElementById('filename');

export default function displayMediaInfo(info) { 
    console.log(info);
    const title = `${info.id}: ${info.originalFilename}`;
    filenameDisplay.innerText = title;

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title
        //     artist: 'Artist Name',
        //     album: 'Album Name',
        //     artwork: [
        //         { src: 'cover.jpg', sizes: '96x96', type: 'image/jpg' },
        //         { src: 'cover.jpg', sizes: '128x128', type: 'image/jpg' },
        //         { src: 'cover.jpg', sizes: '192x192', type: 'image/jpg' }
        //     ]
        });
    }
}