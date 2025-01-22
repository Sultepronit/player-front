// import { listDisplay } from "./uiControls";
export const listDisplay = document.getElementById('playlist');

export function updatePlaylistView(playlist) {
    if (!playlist) return;
    
    let newView = '';
    for (const info of playlist) {
        const originalFilename = info.originalFilename.replaceAll('/', ' | ');
        newView += `<li>${info.id}. ${originalFilename} <sup>${info.rating}</sup></li>`;
    }
    listDisplay.innerHTML = newView;
}