import { unsealCookie } from '../../utils/cookies';
import { fireDb } from '../../utils/firebase';
import { decodeFirestorePath } from '../../utils/pathTransform';

export default defineEventHandler(async (event) => {
    const cookieInfo = await unsealCookie(event);
    if (!cookieInfo || !cookieInfo.user) {
        console.error(`ERROR: Failed to unseal cookie.`);
        return [];
    }

    const userId = cookieInfo.user.sub;

    const query = getQuery(event);
    const encodedDocPath = query.docPath as string;
    if (!encodedDocPath) {
        console.error(`ERROR: required query param 'docPath' not found.`);
        return undefined;
    }

    // Decode the path to handle special characters
    const docPath = decodeFirestorePath(encodedDocPath);
    const docRef = fireDb.doc(docPath);
    const collections = await docRef.listCollections();

    // Map collection references to their IDs
    const collectionNames = collections.map((collection) => collection.id);

    return collectionNames;
});
