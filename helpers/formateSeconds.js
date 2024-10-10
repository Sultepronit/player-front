export default function formateSeconds(inputSeconds) {
    const minutes = Math.floor(inputSeconds / 60);
    const seconds = Math.floor(inputSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}