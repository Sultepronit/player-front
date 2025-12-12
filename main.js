import './style.css';

import LoginView from './src/login/login-view';
// import { uploadFiles } from './services/uploadHandlers';
import { startSession } from './src/playbackHandlers';
import setPlayer from './src/setPlayer';
import { uploadFiles } from './src/services/uploadHandlers';
// import { initiateFilesList } from './src/services/audioFilesHandlers';

console.time('t');

customElements.define('login-view', LoginView);

setPlayer();

startSession();

// initiateFilesList();

document.getElementById('uploadForm').addEventListener('submit', uploadFiles);