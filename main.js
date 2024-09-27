import './style.css';
import fetchBlob from './fetchBlob';
import { getFile, saveFile } from './localDbHandlers';
import { uploadFiles } from './uploadHandlers';
import startSession from './startSession';

console.time('t');

const audio = document.getElementById('the-audio');

startSession();

