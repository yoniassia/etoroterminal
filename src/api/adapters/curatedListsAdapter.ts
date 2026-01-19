// Curated Lists Adapter
// Fetches eToro curated investment lists via REST API

import { ENDPOINTS } from '../contracts/endpoints';
import type { CuratedList, CuratedListsResponse } from '../contracts/etoro-api.types';
import { getDefaultAdapter, RestAdapter } from '../restAdapter';

export interface CuratedListsAdapterConfig {
  restAdapter?: RestAdapter;
}

export class CuratedListsAdapter {
  private readonly restAdapter: RestAdapter;

  constructor(config: CuratedListsAdapterConfig = {}) {
    this.restAdapter = config.restAdapter || getDefaultAdapter();
  }

  async getCuratedLists(): Promise<CuratedList[]> {
    const response = await this.restAdapter.get<CuratedListsResponse>(ENDPOINTS.CURATED_LISTS);
    return response.lists;
  }
}

export function createCuratedListsAdapter(config: CuratedListsAdapterConfig = {}): CuratedListsAdapter {
  return new CuratedListsAdapter(config);
}

let defaultCuratedListsAdapter: CuratedListsAdapter | null = null;

export function getDefaultCuratedListsAdapter(): CuratedListsAdapter {
  if (!defaultCuratedListsAdapter) {
    defaultCuratedListsAdapter = new CuratedListsAdapter();
  }
  return defaultCuratedListsAdapter;
}
