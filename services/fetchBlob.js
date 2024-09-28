const apiUrl = import.meta.env.VITE_API_URL;

export default async function fetchBlob(filename) {
    filename = filename.replace('.', '_');
    const response = await fetch(`${apiUrl}/files/${filename}`);
    if(response.ok) {
        return response.blob();
    }
}