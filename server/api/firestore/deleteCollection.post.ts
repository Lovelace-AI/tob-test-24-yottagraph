import { unsealCookie } from '../../utils/cookies';
import { fireDb } from '../../utils/firebase';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const path = body.path as string;
    if (!path) {
        console.error(`ERROR: required body param 'path' not found.`);
        return undefined;
    }

    const cookieInfo = await unsealCookie(event);
    if (!cookieInfo || !cookieInfo.user) {
        console.error(`ERROR: Failed to unseal cookie.`);
        return undefined;
    }

    fireDb
        .collection(path)
        .listDocuments()
        .then((val) => {
            val.map((val) => {
                val.delete();
            });
        });
});
