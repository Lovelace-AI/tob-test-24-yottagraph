import { formatUrl } from '~/utils/formatUrl';
import { useUserState } from '~/composables/useUserState';

let _baseUrl: string | undefined;

/**
 * customFetch is used by the orval-generated client to call the query server directly.
 */
export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const accessToken = useUserState().accessToken;
    const config = useRuntimeConfig();
    const serverAddress = config.public.queryServerAddress as string;

    if (!_baseUrl && serverAddress) {
        _baseUrl = formatUrl(serverAddress);
    }

    if (!_baseUrl) {
        throw new Error(
            'Query server is not configured. Please configure NUXT_PUBLIC_QUERY_SERVER_ADDRESS.'
        );
    }

    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken.value) {
        headers['Authorization'] = `Bearer ${accessToken.value}`;
    }

    const fullUrl = `${_baseUrl}${url}`;
    const response = await fetch(fullUrl, {
        ...options,
        headers,
        cache: options.method === 'GET' ? 'default' : 'no-store',
    });

    let data: any;

    if (!response.ok) {
        try {
            data = await response.json();
        } catch {
            const errorText = await response.text();
            data = { message: errorText || response.statusText };
        }
    } else {
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0' || response.status === 204) {
            data = {};
        } else {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else if (contentType?.includes('text/')) {
                data = await response.text();
            } else {
                data = response;
            }
        }
    }

    return {
        data,
        status: response.status,
        headers: response.headers,
    } as T;
};
