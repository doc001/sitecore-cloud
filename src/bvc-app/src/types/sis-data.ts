// Auto-generated TypeScript definitions for SIS data
// Generated at: 2026-03-17T14:19:49.436Z

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
