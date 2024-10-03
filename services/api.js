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
        const result = await response[parser]();
        statusBar.className = 'idle';

        return result;
    } catch (error) {
        statusBar.className = 'failed';

        if (error.message.includes('Failed to fetch')) {
            return await retry(fetchWithFeatures, path, method, parser, body);
        } else {
            console.error(error);
        }
    }
}

export async function fetchPlaylist() {
    return await fetchWithFeatures('/list');
}

export async function fetchBlob(filename) {
    filename = filename.replace('.', '_'); // for dev !!!
    return await fetchWithFeatures(`/files/${filename}`, 'GET', 'blob');
}