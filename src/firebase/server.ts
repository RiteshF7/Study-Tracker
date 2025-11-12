
import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

function getFirebaseAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }

    // In a server environment (like Next.js server actions),
    // you might use service account credentials.
    // For simplicity here, we'll use the client-side config,
    // but in a real production scenario, you'd use a service account.
    // Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable.
    return initializeApp({
        // If you have a service account, you can initialize like this:
        // credential: applicationDefault(),
        // For now, we use the client config, which works in some environments
        // but is not the recommended practice for server-side code.
    });
}

export const app = getFirebaseAdminApp();
