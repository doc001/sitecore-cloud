// Auto-generated TypeScript definitions for SIS data
// Generated at: 2026-09-28T20:15:10.821Z

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
    genders: SisDataCategory;
    legalStatuses: SisDataCategory;
    aboriginalStatus: SisDataCategory;
    countries: SisDataCategory;
    languages: SisDataCategory;
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
    genders: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
    legalStatuses: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
    aboriginalStatus: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
    countries: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
    languages: {
      byId: Record<string, SisItem>;
      byName: Record<string, SisItem>;
      bySlug: Record<string, SisItem>;
    };
  };
}
