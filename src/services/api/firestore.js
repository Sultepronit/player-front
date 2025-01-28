import app from "./app";
import { collection, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";

const db = getFirestore(app);

export async function getCollection(name = 'list-details') {
    const details = collection(db, name);
    const querySnapshot = await getDocs(details);
    console.log(querySnapshot);

    const results = [];
    querySnapshot.forEach(doc => {
        results.push({
            id: doc.id,
            ...doc.data(),
        });
    });
    // console.log(results);

    return results;
}

// getCollection();

export async function setDocument(collection, id, data) {
    try {
        const docRef = doc(db, collection, id);
        await setDoc(docRef, data);
        console.log("Document written with ID:", docRef.id);
        return 'success';
    } catch (error) {
        console.warn("Error adding document:", error);
    }
}
  
