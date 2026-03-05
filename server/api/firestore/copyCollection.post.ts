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
    const from = body.from as string;
    if (!from) {
        console.error(`ERROR: required query param 'from' not found.`);
        return;
    }

    const to = body.to as string;
    if (!to) {
        console.error(`ERROR: required query param 'to' not found.`);
        return;
    }

    const fromCollectionRef = fireDb.collection(from);
    const fromCollection = await fromCollectionRef.get();
    if (!fromCollection) {
        console.error('ERROR: No such collection!');
        return;
    }

    const toCollectionRef = fireDb.collection(to);
    const batch = fireDb.batch();

    fromCollection.forEach((doc) => {
        const data = doc.data();
        // Create a new document with the same ID in the target collection
        const newDocRef = toCollectionRef.doc(doc.id);
        batch.set(newDocRef, data);
    });

    try {
        await batch.commit();
        return { success: true, message: `Successfully copied ${fromCollection.size} documents` };
    } catch (error) {
        console.error('ERROR: Failed to copy collection:', error);
        return { success: false, error: 'Failed to copy collection' };
    }
});
