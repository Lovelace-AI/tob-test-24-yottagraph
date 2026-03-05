/**
 * Wrapper around the orval-generated Elemental API client.
 * Run `npm run generate:elemental-client` to generate the client from the OpenAPI spec.
 */

import * as systemApi from './generated/elemental-service/system/system';
import * as entitiesApi from './generated/elemental-service/entities/entities';
import * as reportsApi from './generated/elemental-service/reports/reports';
import * as mentionsApi from './generated/elemental-service/mentions/mentions';
import * as articlesApi from './generated/elemental-service/articles/articles';
import * as graphApi from './generated/elemental-service/graph/graph';
import * as sentimentApi from './generated/elemental-service/sentiment/sentiment';
import * as aiApi from './generated/elemental-service/ai/ai';
import { customFetch } from '~/utils/customFetch';

function createApiWrapper<TFunc extends (...args: any[]) => Promise<any>>(
    apiFunc: TFunc
): (...args: Parameters<TFunc>) => Promise<Awaited<ReturnType<TFunc>>['data']> {
    return async (...args: Parameters<TFunc>) => {
        const response = await apiFunc(...args);
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        }
        throw new Error(`API error: ${response.status}`);
    };
}

/**
 * Raw request for endpoints not covered by the generated client (e.g. POST /query).
 */
async function request<T = any>(
    path: string,
    options: { method?: string; body?: any; query?: Record<string, any> } = {}
): Promise<T> {
    const url = path.startsWith('/') ? path : `/${path}`;
    const queryString =
        options.query && Object.keys(options.query).length > 0
            ? '?' + new URLSearchParams(options.query as Record<string, string>).toString()
            : '';
    const response = await customFetch<{ data: T; status: number }>(`${url}${queryString}`, {
        method: (options.method as RequestInit['method']) || 'GET',
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (response.status >= 200 && response.status < 300) {
        return response.data as T;
    }
    throw new Error(`API error: ${response.status}`);
}

export function useElementalService() {
    return {
        getStatus: createApiWrapper(systemApi.getStatus),

        getNEID: createApiWrapper(entitiesApi.getNEID),
        getEntityDetails: createApiWrapper(reportsApi.getEntityDetails),

        getNamedEntityReport: createApiWrapper(reportsApi.getNamedEntityReport),

        getMentions: createApiWrapper(mentionsApi.getMentions),
        getMentionDetail: createApiWrapper(mentionsApi.getMentionDetail),
        getMentionLookupDetail: createApiWrapper(mentionsApi.getMentionLookupDetail),

        getArticle: createApiWrapper(articlesApi.getArticle),
        getArticleText: createApiWrapper(articlesApi.getArticleText),

        getNeighborhood: createApiWrapper(graphApi.getNeighborhood),
        getNeighborhoodHistory: createApiWrapper(graphApi.getNeighborhoodHistory),
        getGraphLayout: createApiWrapper(graphApi.getGraphLayout),

        getNamedEntitySentiment: createApiWrapper(sentimentApi.getNamedEntitySentiment),

        llmAssistant: createApiWrapper(aiApi.llmAssistant),
        adaMessage: createApiWrapper(aiApi.adaMessage),

        request,

        checkConnection: async (): Promise<boolean> => {
            try {
                await systemApi.getStatus();
                return true;
            } catch {
                return false;
            }
        },
    };
}

// Re-export types from the generated model (with short aliases where needed)
export type { GetNEIDParams } from './generated/elemental-service/model';
export type {
    LovelaceAiComMoongooseQueryApiGetNEIDResponse as GetNEIDResponse,
    LovelaceAiComMoongooseQueryApiGetNamedEntityReportResponse as GetNamedEntityReportResponse,
    LovelaceAiComMoongooseQueryApiNamedEntityReport as NamedEntityReport,
} from './generated/elemental-service/model';
