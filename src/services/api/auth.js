import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import app from "./app";

const auth = getAuth();

const loginView = document.getElementById('login-view');

onAuthStateChanged(auth, user => {
    if (user) {
        // console.log('user:', user);
        loginView.classList.add('hidden');
    } else {
        console.log('Sign in!');
        loginView.classList.remove('hidden');
    }
});

export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // console.log(userCredential);
        console.log(userCredential.user);
        return 'success';
    } catch (error) {
        if (error.message.includes('invalid-credential')) {
            // document.getElementById('auth-message').innerText = 'Хибний логін або пароль';
            console.log('Хибний логін або пароль!');
            return 'fail';
        } else {
            console.warn(error);
        }
    }
}