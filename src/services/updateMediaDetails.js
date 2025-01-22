import { setDocument } from "./api/firestore";

export default async function updateMediaDetails(details) {
    const result = await setDocument('list-details', String(details.id), details);
    console.log(result);
}