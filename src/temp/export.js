import { getStoredItem } from "../../services/localDbHandlers";
import { uploadToStorage } from "../services/api/storage";

async function exportList() {
    console.log('export!');
    console.log(playlist);
    for (const item of playlist) {
        console.log(item);
        await setDocument('list-details', String(item.id), {
            filename: item.filename,
            originalFilename: item.originalFilename,
            rating: 90
        });
    }
}

export async function exportFiles(playlist) {
    console.log('export!');
    console.log(playlist);

    const fromTo = prompt('from, to?');
    const [from, to] = fromTo.split(', ');
    console.log(from, to);

    // let counter = 0;
    // for (const item of playlist) {
    for (let i = from; i < to && i < playlist.length; i++) {
        // break;
        const item = playlist[i];
        console.log(item.filename);
        const blob = await getStoredItem('files', item.filename, 'blob');
        if (!blob) {
            console.warn('No file!');
            continue;
        }
        console.log(blob);

        await uploadToStorage(blob, item.filename);

        // try {
        //     const formData = new FormData();
        //     formData.append('file', blob, item.filename);
        //     const result = await fetchWithFeatures('/import', 'POST', 'text', formData, exportUrl);
        //     console.log(result);
        // } catch (error) {
        //     console.warn(error);
        // }

        // if (counter++ > 0) {
        //     counter = 0;
        //     alert('continue?');
        // }
        // break;
    }
}
