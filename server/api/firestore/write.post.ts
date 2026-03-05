import { unsealCookie } from '../../utils/cookies';
import { fireDb } from '../../utils/firebase';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const cookieInfo = await unsealCookie(event);
    if (!cookieInfo || !cookieInfo.user) {
        console.error(`ERROR: Failed to unseal cookie.`);
        return;
    }

    const userId = cookieInfo.user.sub;

    const docRef = fireDb.doc(body.docPath);
    let dataUpdate: { [index: string]: string } = {};
    dataUpdate[body.fieldName] = body.value;

    // By setting merge to true, it doesn't clobber the whole structure. Otherwise it will.
    // This is a bit of a goofy example, it seems like update() is more useful for things
    // like this: https://firebase.google.com/docs/firestore/manage-data/add-data?hl=en&authuser=0#update-data
    await docRef.set(dataUpdate, { merge: true });
});
