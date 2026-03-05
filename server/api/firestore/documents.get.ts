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
    const encodedCollectionPath = query.collectionPath as string;
    if (!encodedCollectionPath) {
        console.error(`ERROR: required query param 'collectionPath' not found.`);
        return [];
    }

    // Decode the path to handle special characters
    const collectionPath = decodeFirestorePath(encodedCollectionPath);
    const collectionRef = fireDb.collection(collectionPath);
    const documents = await collectionRef.listDocuments();

    // Map document references to their IDs
    const documentIds = documents.map((doc) => doc.id);

    return documentIds;
});
