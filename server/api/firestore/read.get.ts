import { unsealCookie } from '../../utils/cookies';
import { fireDb } from '../../utils/firebase';
import type { DocumentData } from 'firebase/firestore';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const docPath = query.docPath as string;
    if (!docPath) {
        console.error(`ERROR: required query param 'docPath' not found.`);
        return undefined;
    }

    const fieldName = query.fieldName as string;
    const cookieInfo = await unsealCookie(event);
    if (!cookieInfo || !cookieInfo.user) {
        console.error(`ERROR: Failed to unseal cookie.`);
        return undefined;
    }

    const userId = cookieInfo.user.sub;
    const docRef = fireDb.doc(docPath);
    const doc = await docRef.get();
    if (!doc.exists) {
        return undefined;
    }

    const results: DocumentData | undefined = doc.data();
    if (!results) {
        return undefined;
    }

    if (!fieldName) {
        return results;
    }

    if (results.hasOwnProperty(fieldName)) {
        return results[fieldName];
    }

    return undefined;
});
