export default function playBlob(blob) {
    const audioUrl = URL.createObjectURL(blob);
    console.log(audioUrl);
    return audioUrl;
}