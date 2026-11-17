import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addComment,
  createCommunityPost,
  createPost,
  createReport,
  deleteComment,
  deletePost,
  editComment,
  editPost,
  getFeedPosts,
  getHubPostContext,
  getLinkPreview,
  getPostComments,
  getSinglePost,
  getTeamPostContext,
  getTrendingTopics,
  toggleCommentLike,
  togglePostLike,
  toggleRepost,
  type ReportPayload,
} from "./api";
import type {
  CreatePostPayload,
  FeedComment,
  FeedFilter,
  FeedPost,
  PostOwnerType,
} from "./types";
import { useAuthStore } from "@/features/auth/authStore";
import {
  markPostListsStale,
  patchPostCaches,
  prependPost,
  removePostFromCaches,
  restorePostCaches,
  snapshotPostCaches,
} from "./cache";
import { withPostEngagement } from "./metrics";

const feedKey = ["feed-posts"] as const;

export function useFeedPosts(filter: FeedFilter) {
  return useInfiniteQuery({
    queryKey: [...feedKey, filter],
    queryFn: ({ pageParam }) => getFeedPosts(filter, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreatePost(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePostPayload) => {
      if (!userId) throw new Error("Your session could not be resolved.");
      return createPost(userId, payload);
    },
    onSuccess: (post) => {
      if (post?.id) {
        const user = useAuthStore.getState().user;
        prependPost(
          client,
          withPostEngagement({
            likesCount: 0,
            commentsCount: 0,
            repostsCount: 0,
            ...post,
            author: post.author ?? (user ? { id: user.id, username: user.username, profileImage: user.profileImage ?? undefined } : undefined),
          }),
          ["wall-posts", userId],
        );
        markPostListsStale(client);
      } else {
        client.invalidateQueries({ queryKey: feedKey });
        client.invalidateQueries({ queryKey: ["wall-posts", userId] });
      }
      client.invalidateQueries({ queryKey: ["trending-topics"] });
    },
  });
}

export function useCreateCommunityPost(kind: "team" | "hub", communityId: string, userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePostPayload) => {
      if (!userId) throw new Error("Your session could not be resolved.");
      return createCommunityPost(kind, userId, communityId, payload);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [`${kind}-posts`, communityId] });
      client.invalidateQueries({ queryKey: feedKey });
      client.invalidateQueries({ queryKey: [kind, "detail"] });
      client.invalidateQueries({ queryKey: ["trending-topics"] });
    },
  });
}

export function useTogglePostLike(post: FeedPost) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => togglePostLike(post.id, postType(post)),
    onMutate: async () => {
      await Promise.all(
        [["feed-posts"], ["wall-posts"], ["team-posts"], ["hub-posts"], ["post"]].map((queryKey) =>
          client.cancelQueries({ queryKey }),
        ),
      );
      const snapshots = snapshotPostCaches(client);
      patchPostCaches(client, post.id, (current) => {
        const liked = Boolean(current.hasLiked ?? current.userReaction);
        return withPostEngagement({
          ...current,
          hasLiked: !liked,
          userReaction: liked ? null : "LIKE",
          likesCount: Math.max(0, Number(current.likesCount ?? 0) + (liked ? -1 : 1)),
        });
      });
      return { snapshots };
    },
    onError: (_error, _variables, context) => restorePostCaches(client, context?.snapshots),
    onSettled: () => {
      markPostListsStale(client);
      client.invalidateQueries({ queryKey: ["post", post.id] });
    },
  });
}

function bumpComments(client: ReturnType<typeof useQueryClient>, postId: string, delta: number) {
  patchPostCaches(client, postId, (current) => {
    const count = Number(current.commentsCount ?? current.commentCount ?? current.totalComments ?? 0);
    return { ...current, commentsCount: Math.max(0, count + delta) };
  });
}

export function useTrendingTopics() {
  return useQuery({
    queryKey: ["trending-topics"],
    queryFn: getTrendingTopics,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useLinkPreview(url: string | null) {
  return useQuery({
    queryKey: ["link-preview", url],
    queryFn: () => getLinkPreview(url!),
    enabled: Boolean(url),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });
}

export function useSinglePost(postId?: string, teamId?: string, hubId?: string) {
  return useQuery({
    queryKey: ["post", postId, { teamId: teamId ?? null, hubId: hubId ?? null }],
    queryFn: () => getSinglePost(postId!, teamId, hubId),
    enabled: Boolean(postId),
    staleTime: 0,
    retry: 2,
  });
}

export function useHubPostContext(hubId?: string) {
  return useQuery({
    queryKey: ["hub", hubId],
    queryFn: () => getHubPostContext(hubId!),
    enabled: Boolean(hubId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeamPostContext(teamId?: string) {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeamPostContext(teamId!),
    enabled: Boolean(teamId),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePostComments(postId?: string, type: PostOwnerType = "user") {
  return useQuery({
    queryKey: ["post-comments", postId, type],
    queryFn: () => getPostComments(postId!, type),
    enabled: Boolean(postId),
    staleTime: 0,
    retry: 2,
  });
}

export function useAddComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      content,
      parentCommentId,
      type,
    }: {
      postId: string;
      content: string;
      parentCommentId: string | null;
      type: PostOwnerType;
    }) => addComment(postId, content, parentCommentId, type),
    onSuccess: (_data, { postId }) => {
      bumpComments(client, postId, 1);
      markPostListsStale(client);
      client.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });
}

function patchComments(
  comments: FeedComment[] | undefined,
  commentId: string,
  update: (comment: FeedComment) => FeedComment,
): FeedComment[] | undefined {
  return comments?.map((comment) => ({
    ...(comment.id === commentId ? update(comment) : comment),
    replies: patchComments(comment.replies, commentId, update),
  }));
}

export function useToggleCommentLike(postId: string, type: PostOwnerType) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; liked: boolean }) =>
      toggleCommentLike(commentId),
    onMutate: async ({ commentId, liked }) => {
      const key = ["post-comments", postId, type];
      await client.cancelQueries({ queryKey: key });
      const snapshot = client.getQueryData<FeedComment[]>(key);
      const userId = useAuthStore.getState().user?.id;
      client.setQueryData(
        key,
        patchComments(snapshot, commentId, (comment) => ({
          ...comment,
          likes: userId
            ? liked
              ? (comment.likes ?? []).filter((like) => (typeof like === "string" ? like : like.id) !== userId)
              : [...(comment.likes ?? []), userId]
            : comment.likes,
          likesCount: Math.max(
            0,
            Number(comment.likesCount ?? comment.likes?.length ?? 0) + (liked ? -1 : 1),
          ),
        })),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) =>
      client.setQueryData(["post-comments", postId, type], context?.snapshot),
    onSettled: () => client.invalidateQueries({ queryKey: ["post-comments", postId, type] }),
  });
}

export function useEditComment(postId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      editComment(commentId, content),
    onSuccess: () => client.invalidateQueries({ queryKey: ["post-comments", postId] }),
  });
}

export function useDeleteComment(postId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      bumpComments(client, postId, -1);
      markPostListsStale(client);
      client.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });
}

function postType(post: FeedPost): PostOwnerType {
  return post.hubId ? "hub" : post.teamId ? "team" : "user";
}

export function useEditPost(post: FeedPost) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => editPost(post.id, content, postType(post)),
    onSuccess: (_updated, content) => {
      patchPostCaches(client, post.id, (current) => ({ ...current, content }));
      markPostListsStale(client);
      client.invalidateQueries({ queryKey: ["trending-topics"] });
    },
  });
}

export function useDeletePost(post: FeedPost) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => deletePost(post.id, postType(post)),
    onSuccess: () => {
      removePostFromCaches(client, post.id);
      client.removeQueries({ queryKey: ["post", post.id] });
      markPostListsStale(client);
      client.invalidateQueries({ queryKey: ["trending-topics"] });
    },
  });
}

export function useToggleRepost(post: FeedPost) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => toggleRepost(post.id, comment),
    onMutate: async () => {
      await Promise.all([client.cancelQueries({ queryKey: feedKey }), client.cancelQueries({ queryKey: ["post", post.id] })]);
      const snapshots = snapshotPostCaches(client);
      patchPostCaches(client, post.id, (current) =>
        withPostEngagement({
          ...current,
          hasReposted: !current.hasReposted,
          repostsCount: Math.max(0, Number(current.repostsCount ?? 0) + (current.hasReposted ? -1 : 1)),
        }),
      );
      return { snapshots };
    },
    onError: (_error, _comment, context) => restorePostCaches(client, context?.snapshots),
    onSettled: () => {
      markPostListsStale(client);
      client.invalidateQueries({ queryKey: ["post", post.id] });
    },
  });
}

export function useCreateReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportPayload) => createReport(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["reports"] }),
  });
}
