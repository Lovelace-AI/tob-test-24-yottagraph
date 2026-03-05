import { encodeFirestorePath } from '~/utils/pathTransform';
import type { PrefsStore } from '~/composables/usePrefsStore';

// Get the appropriate fetch function based on environment
function getApiFetch() {
    // Check if we're in Electron
    const { isElectron } = useElectron();

    // Only use the local API server in packaged Electron apps (production)
    // In development, window.electron will exist but we'll use the dev server
    const isPackagedElectron =
        isElectron.value && typeof window !== 'undefined' && window.location.protocol === 'file:';

    if (isPackagedElectron) {
        // In packaged Electron app, use the local API server
        return (url: string, options?: any) => {
            const baseURL = 'http://localhost:3001';
            const { userId } = useUserState();

            // Add user ID to headers for Electron API
            const headers = {
                ...options?.headers,
                'x-user-id': userId.value || 'electron-user',
            };

            return $fetch(url, { ...options, baseURL, headers });
        };
    }

    // Otherwise use regular $fetch (for web and Electron dev)
    return $fetch;
}

export class FirestorePrefsStore implements PrefsStore {
    private apiFetch = getApiFetch();

    async copyDoc(from: string, to: string): Promise<void> {
        await this.apiFetch(`/api/firestore/copy`, {
            method: 'POST',
            body: {
                from: from,
                to: to,
            },
        });
    }

    async copyCollection(from: string, to: string): Promise<void> {
        await this.apiFetch(`/api/firestore/copyCollection`, {
            method: 'POST',
            body: {
                from: from,
                to: to,
            },
        });
    }

    async deleteCollection(path: string): Promise<void> {
        await this.apiFetch(`/api/firestore/deleteCollection`, {
            method: 'POST',
            body: {
                path: path,
            },
        });
    }

    async deleteDoc(path: string): Promise<void> {
        await this.apiFetch(`/api/firestore/delete`, {
            method: 'POST',
            body: {
                path: path,
            },
        });
    }

    async readDoc(path: string): Promise<Record<string, string> | undefined> {
        try {
            const safePath = encodeFirestorePath(path);
            const result = await this.apiFetch(
                `/api/firestore/read?docPath=${encodeURIComponent(safePath)}`
            );
            return result as Record<string, string> | undefined;
        } catch (error) {
            console.error(`[FirebasePrefsStore] Failed to read doc ${path}:`, error);
            throw error;
        }
    }

    async getValue<PrefType>(docPath: string, fieldName: string) {
        try {
            const safePath = encodeFirestorePath(docPath);
            const result = await this.apiFetch(
                `/api/firestore/read?docPath=${encodeURIComponent(safePath)}&fieldName=${encodeURIComponent(fieldName)}`
            );
            if (!result) {
                return undefined;
            }

            try {
                return JSON.parse(result as string) as PrefType;
            } catch (e) {
                console.log(`ERROR: Failed to parse JSON: ${e}`);
                return undefined;
            }
        } catch (error) {
            console.error(
                `[FirebasePrefsStore] Failed to get value ${docPath}/${fieldName}:`,
                error
            );
            throw error;
        }
    }

    async listCollections(docPath: string): Promise<string[]> {
        const safePath = encodeFirestorePath(docPath);
        const result = await this.apiFetch(
            `/api/firestore/collections?docPath=${encodeURIComponent(safePath)}`
        );
        return result as string[];
    }

    async listDocuments(collectionPath: string): Promise<string[]> {
        const safePath = encodeFirestorePath(collectionPath);
        const result = await this.apiFetch(
            `/api/firestore/documents?collectionPath=${encodeURIComponent(safePath)}`
        );
        return result as unknown as string[]; // tob xxx - not sure about this.
    }

    async setValue<PrefType>(docPath: string, fieldName: string, value: PrefType) {
        try {
            await this.apiFetch('/api/firestore/write', {
                method: 'POST',
                body: {
                    docPath: docPath,
                    fieldName: fieldName,
                    value: JSON.stringify(value),
                },
            });
        } catch (error) {
            console.error(
                `[FirebasePrefsStore] Failed to set value ${docPath}/${fieldName}:`,
                error
            );
            throw error;
        }
    }
}
