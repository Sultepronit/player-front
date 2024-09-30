const apiUrl = import.meta.env.VITE_API_URL;

function retry(callback, ...args) {
    return new Promise(resolve => {
        setTimeout(
            async () => resolve(await callback(...args)),
            5000
        );
    });
}

export async function fetchWithFeatures(path, method = 'GET', parser = 'json', body = null) {
    try {
        const response = await fetch(apiUrl + path, { method, body });
        const result = await response[parser]();
        return result;
    } catch (error) {
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
    return await fetchWithFeatures(`/files/${filename}`, 'GET', 'blob');
}