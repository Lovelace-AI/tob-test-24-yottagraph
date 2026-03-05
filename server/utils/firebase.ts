import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Expects GOOGLE_APPLICATION_CREDENTIALS to point to the secret keys JSON file.
// Otherwise we default to using the local Firestore emulator. We manually set
// the host and ssl settings if we're using the emulator. Alternatively, we
// could be using FIRESTORE_EMULATOR_HOST to point to the emulator and get rid
// of the host and ssl settings below.
const useProdFirebase = Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS !== ''
);

export const app = useProdFirebase
    ? initializeApp({
          credential: applicationDefault(),
          databaseURL: 'https://elemental-prefs.firebaseio.com',
          projectId: 'lovelace-elemental',
      })
    : initializeApp({
          projectId: 'localprefs',
      });

// only use a custom firestore db if we're using the prod firebase, use the default one otherwise
export const fireDb =
    process.env.FIRESTORE_DATABASE && useProdFirebase
        ? getFirestore(process.env.FIRESTORE_DATABASE)
        : getFirestore();

if (!useProdFirebase) {
    const host = process.env.FIRESTORE_EMULATOR_HOST || '192.168.128.200:8080';
    if (host) {
        fireDb.settings({
            host: host,
            ssl: false,
        });
    }
}
