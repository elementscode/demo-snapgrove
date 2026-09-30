import { LiveTable, ForbiddenError, sql } from "@elements/app";
import { Post, postColumns, postJoins } from "#app/shared/services/posts";

export interface FeedPost extends Post {
  viewerId: string;
}

export const FEED_PAGE = 6;

/**
 * The viewer's home feed: their own posts and the posts of everyone they
 * follow, newest first. The partition is the viewer, projected onto every row
 * so each row belongs to the view that asked for it.
 */
export let feedPosts: LiveTable<FeedPost> = new LiveTable<FeedPost>({
  table: "posts",

  select: ({ viewerId }, w) => sql<FeedPost>(`
    select ${postColumns(viewerId!)}, ${viewerId}::uuid as viewerId
      from ${postJoins()}
     where (p.userId = ${viewerId}::uuid
            or p.userId in (select followeeId from follows where followerId = ${viewerId}::uuid))
       and ${w.keyset("p")}
     order by ${w.order("p")} ${w.page()}
  `),

  insert: () => { throw new ForbiddenError(); },
  update: () => { throw new ForbiddenError(); },
  delete: () => { throw new ForbiddenError(); },
});
