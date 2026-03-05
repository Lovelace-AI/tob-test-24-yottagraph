// Electron-specific implementation of PrefsStore using local storage
export class ElectronPrefsStore implements PrefsStore {
    private storageKey = 'elemental-prefs';

    private async getStorage(): Promise<Record<string, any>> {
        const { storage } = useElectron();
        const data = await storage.get(this.storageKey);
        return data || {};
    }

    private async setStorage(data: Record<string, any>): Promise<void> {
        const { storage } = useElectron();
        await storage.set(this.storageKey, data);
    }

    private getPathKey(path: string, key?: string): string {
        // Convert Firestore-style paths to storage keys
        const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
        return key ? `${cleanPath}.${key}` : cleanPath;
    }

    async copyDoc(from: string, to: string): Promise<void> {
        const storage = await this.getStorage();
        const fromKey = this.getPathKey(from);
        const toKey = this.getPathKey(to);

        if (storage[fromKey]) {
            storage[toKey] = JSON.parse(JSON.stringify(storage[fromKey]));
            await this.setStorage(storage);
        }
    }

    async copyCollection(from: string, to: string): Promise<void> {
        const storage = await this.getStorage();
        const fromPrefix = this.getPathKey(from) + '.';
        const toPrefix = this.getPathKey(to) + '.';

        for (const key in storage) {
            if (key.startsWith(fromPrefix)) {
                const newKey = key.replace(fromPrefix, toPrefix);
                storage[newKey] = JSON.parse(JSON.stringify(storage[key]));
            }
        }
        await this.setStorage(storage);
    }

    async deleteCollection(path: string): Promise<void> {
        const storage = await this.getStorage();
        const prefix = this.getPathKey(path) + '.';

        for (const key in storage) {
            if (key.startsWith(prefix)) {
                delete storage[key];
            }
        }
        await this.setStorage(storage);
    }

    async deleteDoc(path: string): Promise<void> {
        const storage = await this.getStorage();
        const key = this.getPathKey(path);
        delete storage[key];
        await this.setStorage(storage);
    }

    async readDoc(path: string): Promise<Record<string, string> | undefined> {
        const storage = await this.getStorage();
        const key = this.getPathKey(path);
        return storage[key];
    }

    async readField(path: string, fieldName: string): Promise<string | undefined> {
        const doc = await this.readDoc(path);
        return doc?.[fieldName];
    }

    async getValue<PrefType>(docPath: string, fieldName: string): Promise<PrefType | undefined> {
        const doc = await this.readDoc(docPath);
        return doc?.[fieldName] as PrefType | undefined;
    }

    async setValue<T>(path: string, fieldName: string, value: T): Promise<void> {
        const storage = await this.getStorage();
        const key = this.getPathKey(path);

        if (!storage[key]) {
            storage[key] = {};
        }
        storage[key][fieldName] = value;
        await this.setStorage(storage);
    }

    async listCollections(path: string): Promise<string[]> {
        const storage = await this.getStorage();
        const prefix = this.getPathKey(path) + '.';
        const collections = new Set<string>();

        for (const key in storage) {
            if (key.startsWith(prefix)) {
                const remaining = key.substring(prefix.length);
                const firstDot = remaining.indexOf('.');
                if (firstDot > 0) {
                    collections.add(remaining.substring(0, firstDot));
                }
            }
        }

        return Array.from(collections);
    }

    async listDocuments(path: string): Promise<string[]> {
        const storage = await this.getStorage();
        const prefix = this.getPathKey(path) + '.';
        const docs = new Set<string>();

        for (const key in storage) {
            if (key.startsWith(prefix)) {
                const remaining = key.substring(prefix.length);
                if (!remaining.includes('.')) {
                    docs.add(remaining);
                }
            }
        }

        return Array.from(docs);
    }
}
