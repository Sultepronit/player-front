import { listDisplay } from "./uiControls";

export function updatePlaylistView(playlist) {
    if (!playlist) return;
    
    let newView = '';
    for (const info of playlist) {
        const originalFilename = info.originalFilename.replaceAll('/', ' | ');
        newView += `<li>${info.id} - ${originalFilename}</li>`;
    }
    listDisplay.innerHTML = newView;
}