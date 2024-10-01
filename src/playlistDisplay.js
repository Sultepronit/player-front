import { listDisplay } from "./uiControls";

export function updatePlaylistView(playlist) {
    let newView = '';
    for (const info of playlist) {
        // console.log(info.originalFilename);
        newView += `<li>${info.id}: ${info.originalFilename}</li>`;
    }
    console.log(newView);
    listDisplay.innerHTML = newView;
}