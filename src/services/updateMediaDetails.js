import { storeItem } from "../../services/localDbHandlers";
import { setDocument } from "./api/firestore";

export default async function updateMediaDetails(details) {
    // const result = await setDocument('list-details', String(details.id), details);
    // console.log(result);
    setDocument('list-details', String(details.id), details);
    storeItem('playlist', details);
}