import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export function subscribeProgress(uid, callback, onError) {
    return onSnapshot(collection(db, "users", uid, "completedWitches"), (snapshot) => {
        callback(new Set(snapshot.docs.map((entry) => entry.id)));
    }, onError);
}

export async function toggleCompleted(uid, witchId, completed) {
    const reference = doc(db, "users", uid, "completedWitches", witchId);
    if (completed) {
        await deleteDoc(reference);
    } else {
        await setDoc(reference, { completedAt: serverTimestamp() });
    }
}
