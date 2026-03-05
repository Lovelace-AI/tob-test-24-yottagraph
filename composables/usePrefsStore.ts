import { FirestorePrefsStore } from '~/utils/firebasePrefsStore';

export type SettingsDoc = Record<string, string>;
class Pref<PrefType> {
    private _fieldName: string;
    private _docPath: string;
    private _defaultValue: PrefType;
    public r = ref<PrefType>();

    constructor(docPath: string, fieldName: string, defaultValue: PrefType) {
        this._fieldName = fieldName;
        this._docPath = docPath;
        this._defaultValue = defaultValue;
        this.r.value = defaultValue;
    }

    async changeSource(newDocPath: string, settingsDoc: SettingsDoc | undefined = undefined) {
        this._docPath = newDocPath;

        let value = undefined;
        if (settingsDoc) {
            if (settingsDoc.hasOwnProperty(this._fieldName)) {
                value = JSON.parse(settingsDoc[this._fieldName]) as PrefType;
            }
        } else {
            value = (await _prefsStore.getValue<PrefType>(
                this._docPath,
                this._fieldName
            )) as PrefType;
        }

        if (value !== undefined) {
            this.r.value = value;
        } else {
            this.r.value = this._defaultValue;
        }
    }

    async initialize(settingsDoc: SettingsDoc | undefined = undefined) {
        console.log(`Initializing ${this._docPath}/${this._fieldName}`);
        if (settingsDoc) {
            let value = undefined;
            if (settingsDoc.hasOwnProperty(this._fieldName)) {
                value = JSON.parse(settingsDoc[this._fieldName]) as PrefType;
            }
            if (value !== undefined) {
                this.r.value = value;
            }
            console.log(
                `Initialized ${this._docPath}/${this._fieldName} to ${value} from settingsDoc`
            );
        } else {
            const value: PrefType | undefined = (await _prefsStore.getValue<PrefType>(
                this._docPath,
                this._fieldName
            )) as PrefType;
            if (value !== undefined) {
                this.r.value = value;
            }
            console.log(
                `Initialized ${this._docPath}/${this._fieldName} to ${value} from prefsStore`
            );
        }

        // Only attach our watcher once we've read any stored value.
        watch(this.r, () => {
            if (this.r.value !== undefined) {
                this.set(this.r.value);
            }
        });
    }

    set(newValue: PrefType) {
        console.log(`Setting ${this._docPath}/${this._fieldName} to ${newValue}`);
        if (!this._docPath.startsWith('/users/')) {
            return;
        }

        _prefsStore.setValue<PrefType>(this._docPath, this._fieldName, newValue);
        this.r.value = newValue;
    }

    get v(): PrefType | undefined {
        console.log(`Getting ${this._docPath}/${this._fieldName}: ${this.r.value}`);
        return this.r.value;
    }

    debugString(): string {
        return `Pref ${this._docPath}/${this._fieldName}: ${this.r.value}`;
    }
}

// #endregion

// #region Interface for the implementation classes.

export interface PrefsStore {
    // Document operations.
    copyDoc(from: string, to: string): Promise<void>;
    deleteDoc(path: string): Promise<void>;
    readDoc(path: string): Promise<SettingsDoc | undefined>;

    // Collection operations.
    copyCollection(from: string, to: string): Promise<void>;
    deleteCollection(path: string): Promise<void>;

    // Getters
    getValue<PrefType>(docPath: string, fieldName: string): Promise<PrefType | undefined>;

    // Listers
    listCollections(docPath: string): Promise<string[]>;
    listDocuments(collectionPath: string): Promise<string[]>;

    // Setters
    setValue<PrefType>(docPath: string, fieldName: string, value: PrefType): Promise<void>;
}

// #endregion

let userSettings: any = undefined;

let _prefsStore: PrefsStore;

export async function initializePrefsStore() {
    await _initializePrefsStore();
}

async function saveUserInfo(
    userId: string,
    userName: string | undefined,
    userPicture: string | undefined
) {
    console.log(`Saving user info for ${userId}: ${userName} ${userPicture}`);

    await _prefsStore.setValue<string>(`/userinfo/${userId}/`, 'userName', userName ?? '[unknown]');
    await _prefsStore.setValue<string>(`/userinfo/${userId}/`, 'userPicture', userPicture ?? '');
}

async function _initializePrefsStore() {
    const { userId, userName, userPicture } = useUserState();
    const config = useRuntimeConfig();
    const appId = config.public.appId || 'aether-default';

    if (userId.value === undefined) {
        console.error(`ERROR: No user ID found; skipping prefs store initialization.`);
        return;
    }

    // App-specific preferences path with namespace
    const appPrefsPrefix = `/users/${userId.value}/apps/${appId}`;
    // Global preferences path for cross-app settings
    const globalPrefsPrefix = `/users/${userId.value}/global`;

    _prefsStore = new FirestorePrefsStore();

    await saveUserInfo(userId.value, userName.value, userPicture.value);
}

export function usePrefsStore() {
    async function deleteCollection(path: string) {
        await _prefsStore.deleteCollection(path);
    }

    async function listCollections(path: string) {
        const list = await _prefsStore.listCollections(path);
        return list;
    }

    async function listDocuments(collectionPath: string) {
        const list = await _prefsStore.listDocuments(collectionPath);
        return list;
    }

    async function readDoc(path: string) {
        const doc = await _prefsStore.readDoc(path);
        return doc;
    }

    return {
        userSettings,
        deleteCollection,
        listCollections,
        listDocuments,
        readDoc,
    };
}
