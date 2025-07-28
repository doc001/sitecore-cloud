// Auto-generated TypeScript definitions for SIS data
<<<<<<< HEAD
// Generated at: 2025-07-24T16:29:01.246Z
=======
// Generated at: 2025-07-27T15:43:27.232Z
>>>>>>> 854c78b (Jul28 - Trying to get the repo)

export interface SisItem {
  id: string;
  name: string;
  displayName: string;
  path: string;
  template?: string;
  slug: string;
  fields: Record<string, string>;
  rawFields: Array<{ name: string; value: string }>;
}

export interface SisDataCategory {
  items: SisItem[];
  count: number;
  lastUpdated: string;
  error?: string;
}

export interface SisData {
  metadata: {
    generatedAt: string;
    version: string;
    source: string;
    pageSize: number;
    maxItems: number;
  };
  data: {
    deliveryTypes: SisDataCategory;
    campuses: SisDataCategory;
    feeTypes: SisDataCategory;
    timeBlocks: SisDataCategory;
  };
}

export interface SisLookupMap {
  metadata: SisData['metadata'];
  lookups: {
    deliveryTypes: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
    campuses: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
    feeTypes: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
    timeBlocks: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
  };
}
