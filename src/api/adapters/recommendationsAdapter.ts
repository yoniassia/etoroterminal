// Recommendations Adapter
// Provides operations for fetching market recommendations

import { ENDPOINTS } from '../contracts/endpoints';
import type { Recommendation, RecommendationsResponse } from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';

export class RecommendationsAdapter {
  private readonly rest: RestAdapter;

  constructor(restAdapter?: RestAdapter) {
    this.rest = restAdapter || getDefaultAdapter();
  }

  async getRecommendations(): Promise<Recommendation[]> {
    const response = await this.rest.get<RecommendationsResponse>(ENDPOINTS.RECOMMENDATIONS);
    return response.recommendations;
  }
}

export function createRecommendationsAdapter(restAdapter?: RestAdapter): RecommendationsAdapter {
  return new RecommendationsAdapter(restAdapter);
}

let defaultAdapter: RecommendationsAdapter | null = null;

export function getRecommendationsAdapter(): RecommendationsAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new RecommendationsAdapter();
  }
  return defaultAdapter;
}

export function setRecommendationsAdapter(adapter: RecommendationsAdapter): void {
  defaultAdapter = adapter;
}
