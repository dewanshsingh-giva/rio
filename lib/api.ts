import 'server-only';
import type { components } from './api-types';

/**
 * Flat aliases over the generated `components["schemas"]`.
 *
 * openapi-typescript nests every schema under `components["schemas"][Name]`
 * rather than exporting a top-level `Name` type — these are the names the
 * rest of RIO imports. Re-run this list, not `api-types.ts` itself, if a
 * schema in `big-ears/src/domain/api.ts` gets renamed.
 */
type Schemas = components['schemas'];
export type Store = Schemas['Store'];
export type Staff = Schemas['Staff'];
export type StaffPerformance = Schemas['StaffPerformance'];
export type VisitSummary = Schemas['VisitSummary'];
export type VisitDetail = Schemas['VisitDetail'];
export type CoachingRow = Schemas['CoachingRow'];
export type ConversationFeedItem = Schemas['ConversationFeedItem'];
export type FollowUpRow = Schemas['FollowUpRow'];
export type ObservationStat = Schemas['ObservationStat'];
export type Overview = Schemas['Overview'];
export type HomeTrend = Schemas['HomeTrend'];
export type SalesMetrics = Schemas['SalesMetrics'];
export type SalesStaffRow = Schemas['SalesStaffRow'];
export type ProductDemandRow = Schemas['ProductDemandRow'];
export type JobAccepted = Schemas['JobAccepted'];
export type JobPhase = Schemas['JobPhase'];
export type Job = Schemas['Job'];
export type CopilotAnswer = Schemas['CopilotAnswer'];

/** Not a response schema — a query param the client builds, so it is hand-declared. */
export type Range = '7d' | '30d' | 'quarter';
/** Keys of `SalesMetrics['series']`, not its own schema on the wire. */
export type SalesMetricKey = keyof SalesMetrics['series'];

/**
 * THE BIG-EARS CLIENT.
 *
 * This file replaces `lib/data.ts` — a thousand lines that opened a MongoDB
 * connection from inside React Server Components. RIO now has no database
 * driver, no credentials, and no knowledge of the schema. It asks and renders.
 *
 * `server-only` is not decoration: importing this from a client component is a
 * build error, which is what keeps `BIG_EARS_API_KEY` out of the browser bundle.
 * Client components reach the backend through the thin proxies in `app/api/*`.
 *
 * Every call degrades to a fallback rather than throwing, inherited from the
 * monolith's data layer for the same reason: one unreachable endpoint should
 * cost you one empty panel, not the whole page.
 */

const BASE = process.env.BIG_EARS_API_URL ?? process.env.BIGEARS_API_URL ?? 'http://localhost:8080';
const KEY = process.env.BIG_EARS_API_KEY ?? process.env.BIGEARS_API_KEY ?? '';

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | undefined>;

function url(path: string, query?: Query): string {
  const u = new URL(`/v1${path}`, BASE);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== '') u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function request<T>(path: string, opts: { query?: Query; method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url(path, opts.query), {
    method: opts.method ?? 'GET',
    headers: {
      'x-api-key': KEY,
      ...(opts.body ? { 'content-type': 'application/json' } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    // Dashboards read live data; a cached visit list is a wrong visit list.
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new ApiError(res.status, `Big Ears ${res.status} on ${path}${detail ? ` — ${detail.slice(0, 300)}` : ''}`);
  }
  return res.json() as Promise<T>;
}

/** Swallow failures and return `fallback`, so one bad panel is not a 500 page. */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.warn('[api]', (e as Error).message);
    return fallback;
  }
}

/* ── Reference ───────────────────────────────────────────────────────── */

export const getStores = () => safe(request<Store[]>('/stores'), []);

export const getStaff = (store?: string) => safe(request<Staff[]>('/staff', { query: { store } }), []);

export const getStaffPerformance = () => safe(request<StaffPerformance[]>('/staff/performance'), []);

/* ── Visits ──────────────────────────────────────────────────────────── */

export const getVisits = (opts: { store?: string; range?: Range; limit?: number; needsReview?: boolean } = {}) =>
  safe(
    request<VisitSummary[]>('/visits', {
      query: {
        store: opts.store,
        range: opts.range,
        limit: opts.limit,
        needsReview: opts.needsReview === undefined ? undefined : String(opts.needsReview),
      },
    }),
    [],
  );

/** One request for what used to be eight database round trips. */
export async function getVisitDetail(id: string): Promise<VisitDetail | null> {
  try {
    return await request<VisitDetail>(`/visits/${encodeURIComponent(id)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    console.warn('[api]', (e as Error).message);
    return null;
  }
}

export const getConversations = (opts: { store?: string; range?: Range; limit?: number } = {}) =>
  safe(request<ConversationFeedItem[]>('/conversations', { query: opts }), []);

export const getCoaching = () => safe(request<CoachingRow[]>('/coaching'), []);

export const getFollowUps = (store?: string) => safe(request<FollowUpRow[]>('/followups', { query: { store } }), []);

/* ── Analytics ───────────────────────────────────────────────────────── */

const EMPTY_OVERVIEW: Overview = {
  visits: [], staff: [], storePerf: [], totalVisits: 0,
  overall: null, hospitality: null, sales: null, accuracy: null, conversion: null,
  needsReview: 0, opportunity: 0, topIssues: [],
};

export const getOverview = (opts: { store?: string; range?: Range } = {}) =>
  safe(request<Overview>('/analytics/overview', { query: opts }), EMPTY_OVERVIEW);

export const getHomeTrend = (opts: { store?: string; range?: Range } = {}) =>
  safe(request<HomeTrend>('/analytics/home-trend', { query: opts }), {
    labels: [], visits: [], storeHealth: [], conversion: [], opportunityRevenue: [],
  });

export const getObservationStats = () => safe(request<ObservationStat[]>('/analytics/observation-stats'), []);

const EMPTY_SALES: SalesMetrics = {
  labels: [],
  series: {
    sales: { current: null, trend: [] },
    hospitality: { current: null, trend: [] },
    accuracy: { current: null, trend: [] },
    objection: { current: null, trend: [] },
    attach: { current: null, trend: [] },
    offer: { current: null, trend: [] },
  },
};

export const getSalesMetrics = (opts: { store?: string; range?: Range } = {}) =>
  safe(request<SalesMetrics>('/analytics/sales', { query: opts }), EMPTY_SALES);

export const getSalesStaff = (store?: string) =>
  safe(request<SalesStaffRow[]>('/analytics/sales/staff', { query: { store } }), []);

export const getProductDemand = () => safe(request<ProductDemandRow[]>('/analytics/product-demand'), []);

/* ── Ingest, jobs, copilot ───────────────────────────────────────────
 * These are called from the `app/api/*` proxies on behalf of client
 * components, so they deliberately throw rather than degrade — the caller
 * needs the real status code to show a useful error. */

export const ingestAudio = (body: unknown) =>
  request<JobAccepted>('/ingest/audio', { method: 'POST', body });

export const ingestTranscript = (body: unknown) =>
  request<JobAccepted>('/ingest/transcript', { method: 'POST', body });

export const getJob = (id: string) => request<Job>(`/jobs/${encodeURIComponent(id)}`);

export const askCopilot = (body: unknown) =>
  request<CopilotAnswer>('/copilot', { method: 'POST', body });

/** Where the browser should point an `<a download>` for the CSV. */
export const exportUrl = (opts: { store?: string; range?: Range }) => url('/export/visits.csv', opts);

/* ── Health ──────────────────────────────────────────────────────────
 * Replaces `isConfigured()`, which used to mean "is MONGODB_URI set" — a
 * question RIO can no longer answer, and no longer needs to. */

export async function isBackendUp(): Promise<boolean> {
  try {
    const res = await fetch(new URL('/ready', BASE), { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}
