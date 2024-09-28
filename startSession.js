import fetchBlob from "./services/fetchBlob";
import { getStoredItem, storeItem } from "./services/localDbHandlers";
import updateFilenames from "./services/updateFilenames";

const audio = document.getElementById('the-audio');

let filenames = [];

export default async function startSession() {
    filenames = await getStoredItem('filenames', 'filenames', 'data');
    console.log(filenames);

    if(!filenames) {
        filenames = await updateFilenames();
        if (filenames) {
            storeItem('filenames', { id: 'filenames', data: filenames });
        } 
    } else {
        const remoteFilenames = await updateFilenames();
        if (remoteFilenames && remoteFilenames.length !== filenames?.length) {
            storeItem('filenames', { id: 'filenames', data: remoteFilenames });
        } 
    }

    choseNext();
}

async function setSrc(filename) {
    let audioBlob = await getStoredItem('files', filename, 'blob');
    console.log('stored:', audioBlob);
    if (!audioBlob) {
        audioBlob = await fetchBlob(filename);
        console.log('fetched:', audioBlob);
        if (audioBlob) {
            storeItem('files', { filename, blob: audioBlob });
        }
    }
    audio.src = URL.createObjectURL(audioBlob);
    console.log(audio);
}

let listIndex = -1;
export async function choseNext(play = false) {
    listIndex++;
    if(listIndex >= filenames.length) listIndex = 0;
    await setSrc(filenames[listIndex]);

    if (play) audio.play();
}

export async function chosePrevisous(play = false) {
    listIndex--;
    if(listIndex < 0) listIndex = filenames.length - 1;
    await setSrc(filenames[listIndex]);

    if (play) audio.play();
}

audio.onended = () => choseNext(true);

document.getElementById('next-button')
    .addEventListener('click', async () => choseNext(true));

export { audio };