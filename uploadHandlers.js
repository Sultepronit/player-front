const fileInput = document.getElementById('fileInput');
const formData = new FormData();

export async function uploadFiles(e) {
    e.preventDefault();
    console.log('Here we go!');
    console.log(fileInput.files);
    // console.log(fileInput.files.pop());
    for(const file of fileInput.files) {
        console.log(file);
        const formData = new FormData();
        formData.append('file', file);
        console.log(formData);
        try {
            await fetch('https://example.com/', {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.warn(error);
        }
        
    }
}