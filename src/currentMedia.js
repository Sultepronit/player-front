import updateMediaDetails from "./services/updateMediaDetails";

const filenameDisplay = document.getElementById('filename');
const ratingDisplay = document.getElementById('media-rating');

let currentMediaDetails = null;

function displayMediaInfo(details) { 
    ratingDisplay.innerText = details.rating;

    // const title = `${details.id}: ${details.originalFilename}`;
    // filenameDisplay.innerText = title;
    filenameDisplay.innerText = `${details.id}: ${details.originalFilename}`;

    const year = details.originalFilename.split('/')[0];
    const album = `${year}/${details.id}`;
    // console.log(album);

    const fileName = details.originalFilename.replace(`${year}/`, '');
    // console.log(fileName);

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: fileName,
            // artist: 'Artist Name',
            album,
        //     artwork: [
        //         { src: 'cover.jpg', sizes: '96x96', type: 'image/jpg' },
        //         { src: 'cover.jpg', sizes: '128x128', type: 'image/jpg' },
        //         { src: 'cover.jpg', sizes: '192x192', type: 'image/jpg' }
        //     ]
        });
    }
}

export function setCurrentMedia(details) { 
    console.log(details);
    currentMediaDetails = details;
    displayMediaInfo(details);
}

export function getCurrentMedia() {
    return currentMediaDetails;
}

export function changeRating(increment) {
    currentMediaDetails.rating += increment;
    if (currentMediaDetails.rating < 0) currentMediaDetails.rating = 0;
    if (currentMediaDetails.rating > 100) currentMediaDetails.rating = 100;

    console.log(currentMediaDetails);

    updateMediaDetails(currentMediaDetails);

    ratingDisplay.innerText = currentMediaDetails.rating;
}