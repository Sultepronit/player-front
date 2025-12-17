// import { listDisplay } from "./uiControls";
export const listDisplay = document.getElementById('playlist');

export function updatePlaylistView(playlist, available) {
    if (!playlist) return;
    // available.sort((a, b) => a - b);
    // console.log(available);
    
    let newView = '';
    for (const info of playlist) {
        const originalFilename = info.originalFilename.replaceAll('/', ' | ');
        // newView += `<li>${info.id}. <sup>${info.rating}</sup> ${originalFilename}</li>`;
        const isAvailable = available.includes(info.id) ? 'is-available' : '';
        newView += `<li class="track ${isAvailable}" id="track-${info.id}">
            ${info.id}. ${originalFilename} <span class="li-rating">${info.rating}</span>
        </li>`;
    }
    listDisplay.innerHTML = newView;
}

export function displayNewAvailable(id) {
    const element = document.getElementById(`track-${id}`);
    // console.log(element);
    element.classList.add('is-available');
}