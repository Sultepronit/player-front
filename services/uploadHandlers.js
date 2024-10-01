import { fetchWithFeatures } from "./api";

const apiUrl = import.meta.env.VITE_API_URL;

let files = [];

// document.getElementById('uploadForm').addEventListener('submit', uploadFiles);
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

async function uploadRecursively() {
    const file = files.pop();
    console.log(file);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await fetchWithFeatures('/upload', 'POST', 'text', formData);
        console.log(result);
    } catch (error) {
        console.warn(error);
    }

    console.log(files);
    updatelistView();
    if(files.length) uploadRecursively();
}

export async function uploadFiles(e) {
    e.preventDefault();

    uploadRecursively();
    // console.log(files);
    // console.log(fileInput.files.pop());
    // for(const file of files) {
    //     console.log(file);
    //     const formData = new FormData();
    //     formData.append('file', file);

    //     try {
    //         const response = await fetch(`${apiUrl}/upload`, {
    //             // method: 'POST',
    //             method: 'PATCH',
    //             body: formData
    //         });
    //         const result = await response.text();
    //         console.log(result);
    //     } catch (error) {
    //         console.warn(error);
    //     }
    // }
}