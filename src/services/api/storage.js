import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { fetchWithFeatures } from '../../../services/api';

const storage = getStorage();
console.log(storage);

// export async function uploadBlob(filename, blob) {
// export async function uploadBlob(blob, folderPath, filename) {
//     const storageRef = ref(storage, `${folderPath}/${filename}`);
//     await uploadBytes(storageRef, blob);
//     console.log('Successfully uploaded!');
// }

export async function uploadToStorage(blob, filename, folderPath = 'audio') {
    const storageRef = ref(storage, `${folderPath}/${filename}`);
    await uploadBytes(storageRef, blob);
    console.log('Successfully uploaded!');
}

export async function getFileUrl(folderPath, filename) {
    const fileRef = ref(storage, `${folderPath}/${filename}`);
    try {
        return await getDownloadURL(fileRef);   
    } catch (error) {
        return null;
    }
}

export async function getFileFromStorage(filename, folderPath = 'audio') {
    try {
        const url = await getFileUrl(folderPath, filename);
        console.log(url);
        if (!url) return null;

        return fetchWithFeatures(url, 'GET', 'blob', null, '');
    } catch (error) {
        return null;
    }
}

// const listRef = ref(storage, 'audio');

// const result = await listAll(listRef);
// console.log(result);

// console.log(await getFileFromStorage('1.mp374'));