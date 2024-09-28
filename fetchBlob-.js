export default async function fetchBlob(url) {
    const response = await fetch(url);
    if(response.ok) {
        return response.blob();
    }
}