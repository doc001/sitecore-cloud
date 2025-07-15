// Auto-generated TypeScript definitions for SIS data
<<<<<<< HEAD
// Generated at: 2025-07-09T18:18:11.317Z
=======
// Generated at: 2025-07-09T02:28:51.413Z
>>>>>>> bc9d86be03755ee4572eb77f6f04ca2cf60da51b

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
