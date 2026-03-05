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

    const fromDocRef = fireDb.doc(from);
    const fromDoc = await fromDocRef.get();
    if (!fromDoc.exists) {
        console.error('ERROR: No such document!');
        return;
    }

    const fromDocData: DocumentData | undefined = fromDoc.data();
    if (!fromDocData) {
        console.error('ERROR: No data in document!');
        return;
    }

    const toDocRef = fireDb.doc(to);
    await toDocRef.set(fromDocData);
});
