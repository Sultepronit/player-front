// import { listDisplay } from "./uiControls";
export const listDisplay = document.getElementById('playlist');

export function updatePlaylistView(playlist) {
    if (!playlist) return;
    
    let newView = '';
    for (const info of playlist) {
        const originalFilename = info.originalFilename.replaceAll('/', ' | ');
        // newView += `<li>${info.id}. <sup>${info.rating}</sup> ${originalFilename}</li>`;
        newView += `<li>
            ${info.id}. ${originalFilename} <span class="li-rating">${info.rating}</span>
        </li>`;
    }
    listDisplay.innerHTML = newView;
}