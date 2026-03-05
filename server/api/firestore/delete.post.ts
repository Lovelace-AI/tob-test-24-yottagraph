import { unsealCookie } from '../../utils/cookies';
import { fireDb } from '../../utils/firebase';
import type { DocumentData } from 'firebase/firestore';

export default defineEventHandler(async (event) => {
    const cookieInfo = await unsealCookie(event);
    if (!cookieInfo || !cookieInfo.user) {
        console.error(`ERROR: Failed to unseal cookie.`);
        return;
    }

    const userId = cookieInfo.user.sub;

    const body = await readBody(event);
    const path = body.path as string;
    if (!path) {
        console.error(`ERROR: required query param 'path' not found.`);
        return;
    }

    const docRef = fireDb.doc(path);
    const doc = await docRef.get();
    if (!doc.exists) {
        console.error('ERROR: No such document!');
        return;
    }

    const docData: DocumentData | undefined = doc.data();
    if (!docData) {
        console.error('ERROR: No data in document!');
        return;
    }

    await docRef.delete();
});
