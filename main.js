import './style.css';
import { uploadFiles } from './services/uploadHandlers';
import { startSession } from './src/playbackHandlers';
import setPlayer from './src/setPlayer';

console.time('t');

setPlayer();

startSession();

document.getElementById('uploadForm').addEventListener('submit', uploadFiles);