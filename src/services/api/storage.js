import { getDownloadURL, getStorage, listAll, ref, uploadBytes } from 'firebase/storage';
// import app from './app';

const storage = getStorage();
// const storage = getStorage(app);
console.log(storage);
// console.log(app);

// export async function uploadBlob(filename, blob) {
export async function uploadBlob(blob, folderPath, filename) {
    const storageRef = ref(storage, `${folderPath}/${filename}`);
    await uploadBytes(storageRef, blob);
    console.log('Successfully uploaded!');
}

export async function getFileUrl(folderPath, filename) {
    const fileRef = ref(storage, `${folderPath}/${filename}`);
    return await getDownloadURL(fileRef);
}

// const listRef = ref(storage, 'audio');

// const result = await listAll(listRef);
// console.log(result);