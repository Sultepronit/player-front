import { initializeApp } from "firebase/app";

const projectId = import.meta.env.VITE_PROJECT_ID;
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    projectId,
    storageBucket: `${projectId}.appspot.com`,
};

const app = initializeApp(firebaseConfig);

export default app;