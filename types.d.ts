type Nindex = string;

export {};

declare global {
    interface Window {
        electronAPI?: {
            platform: string;
            isElectron: boolean;
            getVersion: () => Promise<string>;
            getPlatformInfo: () => Promise<any>;
            minimize: () => void;
            maximize: () => void;
            close: () => void;
            store: {
                get: (key: string) => Promise<any>;
                set: (key: string, value: any) => Promise<void>;
                delete: (key: string) => Promise<void>;
            };
            auth0TokenExchange: (code: string, redirectUri: string) => Promise<any>;
            clearAuthCookies: () => Promise<boolean>;
        };
        nodeAPI?: {
            versions: any;
        };
    }
}
