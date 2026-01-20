// Feeds REST Adapter
// Provides operations for creating and fetching feed posts

import { ENDPOINTS } from '../contracts/endpoints';
import type {
  FeedPost,
  CreatePostRequest,
  CreatePostResponse,
  FeedResponse,
} from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';

// ============================================================================
// Feeds Adapter Class
// ============================================================================

export interface FeedQueryOptions {
  cursor?: string;
  limit?: number;
}

export class FeedsAdapter {
  private readonly rest: RestAdapter;

  constructor(restAdapter?: RestAdapter) {
    this.rest = restAdapter || getDefaultAdapter();
  }

  async createPost(content: string, instrumentId?: number): Promise<FeedPost> {
    const request: CreatePostRequest = {
      content,
      instrumentId,
    };

    const response = await this.rest.post<CreatePostResponse>(
      ENDPOINTS.FEED_CREATE_POST,
      request
    );

    return response.post;
  }

  async getUserFeed(userId: string, options?: FeedQueryOptions): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (options?.cursor) {
      params.append('cursor', options.cursor);
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `${ENDPOINTS.FEED_USER(userId)}?${queryString}`
      : ENDPOINTS.FEED_USER(userId);
    return this.rest.get<FeedResponse>(endpoint);
  }

  async getInstrumentFeed(instrumentId: number, options?: FeedQueryOptions): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (options?.cursor) {
      params.append('cursor', options.cursor);
    }
    if (options?.limit) {
      params.append('limit', options.limit.toString());
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `${ENDPOINTS.FEED_INSTRUMENT(instrumentId)}?${queryString}`
      : ENDPOINTS.FEED_INSTRUMENT(instrumentId);
    return this.rest.get<FeedResponse>(endpoint);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createFeedsAdapter(restAdapter?: RestAdapter): FeedsAdapter {
  return new FeedsAdapter(restAdapter);
}

// ============================================================================
// Default Instance (singleton pattern)
// ============================================================================

let defaultAdapter: FeedsAdapter | null = null;

export function getFeedsAdapter(): FeedsAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new FeedsAdapter();
  }
  return defaultAdapter;
}

export function setFeedsAdapter(adapter: FeedsAdapter): void {
  defaultAdapter = adapter;
}
