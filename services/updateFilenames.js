const apiUrl = import.meta.env.VITE_API_URL;

export default async function updateFilenames() {
    try {
        const response = await fetch(`${apiUrl}/list`);
        const remoteFilenames = await response.json();
        console.log('remote:', remoteFilenames);
        // if (remoteFilenames && remoteFilenames.length !== localFilenames?.length) {
        //     storeItem('filenames', { id: 'filenames', data: remoteFilenames });
        // } 
        return remoteFilenames;
    } catch (error) {
        console.warn(error);
    }
}