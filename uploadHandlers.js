const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');

export async function uploadFiles(e) {
    e.preventDefault();
    console.log('Here we go!');
    console.log(fileInput.files);
    // console.log(fileInput.files.pop());
    for(const file of [...fileInput.files, ...folderInput.files]) {
        console.log(file);
        const formData = new FormData();
        formData.append('file', file);
        // console.log(formData);
        try {
            const response = await fetch('https://dthjysrf.duckdns.org/player/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.text();
            console.log(result);
        } catch (error) {
            console.warn(error);
        }
        
    }
}