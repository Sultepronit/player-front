const apiUrl = import.meta.env.VITE_API_URL;

export default async function startSession() {
    const response = await fetch(`${apiUrl}/list`);
    const urlList = await response.json();
    console.log(urlList);

    const audio = document.getElementById('the-audio');
    audio.src = `${apiUrl}/files/` + urlList[0];
}