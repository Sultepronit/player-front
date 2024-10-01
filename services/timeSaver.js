import { audio } from "../main";

export function saveTime() {
    localStorage.setItem('currentTime', audio.currentTime);
    console.log('saved:', audio.currentTime);
}

export function restoreTime() {
    // return JSON.parse(localStorage.getItem('currentTime')) || 0;
    audio.currentTime = JSON.parse(localStorage.getItem('currentTime')) || 0;
}