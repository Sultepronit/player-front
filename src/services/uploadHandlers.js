import { getCollection, getCollectionSize, setDocument } from "./api/firestore";
import { uploadBlob, uploadToStorage } from "./api/storage";
import { fetchBlob, fetchWithFeatures } from "../../services/api";

const apiUrl = import.meta.env.VITE_API_URL;

let files = [];

const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const uploadList = document.getElementById('upload-list');

function gatherFiles() {
    files = [...fileInput.files, ...folderInput.files];
    updatelistView();
    console.log(files);
}

fileInput.addEventListener('input', gatherFiles);
folderInput.addEventListener('input', gatherFiles);

export function updatelistView() {
    let newView = '';
    for (const item of files) {
        newView += `<li>${item.webkitRelativePath || item.name}</li>`;
    }
    uploadList.innerHTML = newView;
}

let lastId = 1000;
function prepareDetails(inputName) {
    console.log(inputName);
    const dotIndex = inputName.lastIndexOf('.');
    const year = new Date().getFullYear();
    return {
        id: String(++lastId),
        filename: `${lastId}.${inputName.substring(dotIndex + 1).toLowerCase()}`,
        originalFilename: `${year}/${inputName.substring(0, dotIndex)}`,
        rating: 100
    };
}

async function uploadRecursively() {
    const file = files.pop();
    console.log(file);
    // const formData = new FormData();
    // formData.append('file', file);

    try {
        // const result = await fetchWithFeatures('/upload', 'POST', 'text', formData);
        // console.log(result);
        // uploadBlob(file, 'audio', '200.mpp');
        const details = prepareDetails(file.name);
        // uploadBlob(file, 'audio', filename);
        // console.log(details);
        // console.log('fake upload!');
        await uploadToStorage(file, details.filename);
        await setDocument('list-details', details.id, details);
        console.log('uploaded', details);
    } catch (error) {
        console.warn(error);
    }

    console.log(files);
    updatelistView();
    if(files.length) uploadRecursively();
}


export async function uploadFiles(e) {
    e.preventDefault();

    // const playlist = await getCollection();
    // console.log(playlist.length + 1);
    // lastId = playlist.length;
    lastId = await getCollectionSize();
    // console.log()

    uploadRecursively();
}