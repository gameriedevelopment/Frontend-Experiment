import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { FeedPost } from "./types";

export const postCacheRoots: readonly QueryKey[] = [
  ["feed-posts"],
  ["wall-posts"],
  ["team-posts"],
  ["hub-posts"],
  ["admin-wall-posts"],
  ["post"],
];

type CacheRecord = Record<string, unknown>;
export type PostCacheSnapshot = Array<[QueryKey, unknown]>;

function isRecord(value: unknown): value is CacheRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Patch a post wherever React Query may store it without disturbing its envelope. */
export function patchPostCacheValue(
  value: unknown,
  postId: string,
  patcher: (post: FeedPost) => FeedPost,
): unknown {
  if (Array.isArray(value)) return value.map((item) => patchPostCacheValue(item, postId, patcher));
  if (!isRecord(value)) return value;

  let next: CacheRecord = value;
  if (value.id === postId) next = patcher(value as unknown as FeedPost) as unknown as CacheRecord;

  const nestedKeys = ["data", "pages", "posts", "items", "repostOf", "originalPost"] as const;
  for (const key of nestedKeys) {
    if (!(key in next)) continue;
    const nested = patchPostCacheValue(next[key], postId, patcher);
    if (nested !== next[key]) next = { ...next, [key]: nested };
  }
  return next;
}

export function snapshotPostCaches(client: QueryClient): PostCacheSnapshot {
  return postCacheRoots.flatMap((queryKey) => client.getQueriesData({ queryKey }));
}

export function patchPostCaches(
  client: QueryClient,
  postId: string,
  patcher: (post: FeedPost) => FeedPost,
) {
  postCacheRoots.forEach((queryKey) => {
    client.setQueriesData({ queryKey }, (current) => patchPostCacheValue(current, postId, patcher));
  });
}

export function restorePostCaches(client: QueryClient, snapshots?: PostCacheSnapshot) {
  snapshots?.forEach(([queryKey, data]) => client.setQueryData(queryKey, data));
}

/** Drop a post from every list it appears in, including reposts that embed it. */
export function removePostCacheValue(value: unknown, postId: string): unknown {
  if (Array.isArray(value)) {
    const kept = value.filter((item) => !(isRecord(item) && item.id === postId));
    const next = kept.map((item) => removePostCacheValue(item, postId));
    return next.length === value.length && next.every((item, index) => item === value[index]) ? value : next;
  }
  if (!isRecord(value)) return value;
  let next: CacheRecord = value;
  for (const key of ["data", "pages", "posts", "items"] as const) {
    if (!(key in next)) continue;
    const nested = removePostCacheValue(next[key], postId);
    if (nested !== next[key]) next = { ...next, [key]: nested };
  }
  return next;
}

export function removePostFromCaches(client: QueryClient, postId: string) {
  postCacheRoots.forEach((queryKey) => {
    client.setQueriesData({ queryKey }, (current) => removePostCacheValue(current, postId));
  });
}

/** Put a just-created post at the top of the lists it belongs to, so it shows without a refetch. */
export function prependPost(client: QueryClient, post: FeedPost, wallKey: QueryKey) {
  client.setQueryData<{ pages: Array<{ posts: FeedPost[] }>; pageParams: unknown[] }>(["feed-posts", "all"], (current) =>
    current?.pages.length
      ? { ...current, pages: [{ ...current.pages[0], posts: [post, ...current.pages[0].posts.filter((item) => item.id !== post.id)] }, ...current.pages.slice(1)] }
      : current,
  );
  client.setQueryData<FeedPost[]>(wallKey, (current) => (Array.isArray(current) ? [post, ...current.filter((item) => item.id !== post.id)] : current));
}

/** Lists go stale but aren't refetched now, so a ranked feed doesn't reshuffle under the reader. */
export function markPostListsStale(client: QueryClient) {
  for (const queryKey of [["feed-posts"], ["wall-posts"], ["team-posts"], ["hub-posts"]]) {
    void client.invalidateQueries({ queryKey, refetchType: "none" });
  }
}
