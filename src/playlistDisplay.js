// import { listDisplay } from "./uiControls";
export const listDisplay = document.getElementById('playlist');

export function updatePlaylistView(playlist) {
    if (!playlist) return;
    
    let newView = '';
    const list = [...playlist].sort((a, b) => a.id - b.id); //.filter(entry => entry.rating > 0);
    for (const info of list) {
        const originalFilename = info.originalFilename.replaceAll('/', ' | ');
        newView += `<li>${info.id}. ${originalFilename} <sup>${info.rating}</sup></li>`;
    }
    listDisplay.innerHTML = newView;
}