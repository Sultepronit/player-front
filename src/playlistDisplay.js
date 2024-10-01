import { listDisplay } from "./uiControls";

export function updatePlaylistView(playlist) {
    let newView = '';
    for (const info of playlist) {
        newView += `<li>${info.id}: ${info.originalFilename}</li>`;
    }
    listDisplay.innerHTML = newView;
}