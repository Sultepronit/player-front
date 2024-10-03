import { addMessage } from "../src/handleMessages";

const apiUrl = import.meta.env.VITE_API_URL;

function retry(callback, ...args) {
    return new Promise(resolve => {
        setTimeout(
            async () => resolve(await callback(...args)),
            5000
        );
    });
}

const statusBar = document.getElementById('status');

export async function fetchWithFeatures(path, method = 'GET', parser = 'json', body = null) {
    statusBar.className = 'loading';

    try {
        const response = await fetch(apiUrl + path, { method, body });
        if (!response.ok) throw new Error(`${response.status} (${response.statusText})`);
        // console.log(response);
        const result = await response[parser]();
        statusBar.className = 'idle';

        return result;
    } catch (error) {
        statusBar.className = 'failed';

        if (error.message.includes('Failed to fetch')) {
            return await retry(fetchWithFeatures, path, method, parser, body);
        } else {
            console.error(error);
            addMessage(error.message);
        }
    }
}

export async function fetchPlaylist() {
    return await fetchWithFeatures('/list');
}

const doChangeFilename = import.meta.env.VITE_CHANGE_FILENAME;

export async function fetchBlob(filename) {
    if (doChangeFilename) {
        filename = filename.replace('.', '_'); // for dev !!!
    }
    return fetchWithFeatures(`/files/${filename}`, 'GET', 'blob');
}