import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
// import app from './app';

const storage = getStorage();
// const storage = getStorage(app);
console.log(storage);
// console.log(app);

// export async function uploadBlob(filename, blob) {
export async function uploadBlob(blob, folderPath, filename) {
    console.log('here we go!');
    // const storageRef = ref(storage, filename);
    const storageRef = ref(storage, `${folderPath}/${filename}`);
    await uploadBytes(storageRef, blob);
    console.log('Successfully uploaded!');
}

export async function getFileUrl(folderPath, filename) {
    const fileRef = ref(storage, `${folderPath}/${filename}`);
    return await getDownloadURL(fileRef);
}

// console.log(await getFileUrl('dir1', '56.txt'));
// console.log(await getFileUrl('audio', '1.mp3'));