import { Channel, sql, session, NotFoundError } from "@elements/app";

export interface Post {
  id: string;
  createdAt: Date;
  userId: string;
  caption: string;
  seedPhoto: string | null;
  imageId: string | null;
  imageHash: string | null;
  likeCount: number;
  commentCount: number;
  handle: string;
  name: string;
  avatarSeed: string | null;
  avatarImageId: string | null;
  avatarHash: string | null;
  likedByMe: boolean;
}

/** The counts a post shows, broadcast to every open page when they change. */
export interface PostStats {
  postId: string;
  likeCount: number;
  commentCount: number;
}

export const postStats = new Channel<PostStats>("postStats");

/** The select list every post query shares, with the viewer's own like. */
export function postColumns(viewerId: string) {
  return sql.raw(`
    p.id, p.createdAt, p.userId, p.caption, p.seedPhoto, p.imageId,
    pi.hash as imageHash, p.likeCount, p.commentCount,
    u.handle, u.name, u.avatarSeed, u.avatarImageId, ai.hash as avatarHash,
    exists (select 1 from likes l where l.postId = p.id and l.userId = ${viewerId}::uuid) as likedByMe
  `);
}

export function postJoins() {
  return sql.raw(`
    posts p
    join users u on u.id = p.userId
    left join images pi on pi.id = p.imageId
    left join images ai on ai.id = u.avatarImageId
  `);
}

export function readPost(id: string, viewerId: string): Post {
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new NotFoundError("post not found");
  }

  return sql<Post>(`
    select ${postColumns(viewerId)} from ${postJoins()} where p.id = ${id}::uuid
  `).firstOrThrow("post not found");
}

/** Popular recent posts: likes and comments over the last two weeks. */
export function explorePosts(viewerId: string): Post[] {
  return sql<Post>(`
    select ${postColumns(viewerId)}
      from ${postJoins()}
     where p.createdAt > now() - interval '14 days'
     order by p.likeCount + 2 * p.commentCount desc, p.createdAt desc
     limit 30
  `).all();
}

export function userPosts(userId: string, viewerId: string): Post[] {
  return sql<Post>(`
    select ${postColumns(viewerId)}
      from ${postJoins()}
     where p.userId = ${userId}::uuid
     order by p.createdAt desc, p.id desc
     limit 120
  `).all();
}

export function publishStats(postId: string): PostStats {
  let stats = sql<PostStats>(`
    select id as postId, likeCount, commentCount from posts where id = ${postId}::uuid
  `).firstOrThrow("post not found");

  postStats.notify(stats);

  return stats;
}

/**
 * Takes the state the viewer wants rather than a toggle, so a double click or
 * a retried request lands in the same place.
 * @rpc
 */
export function setLiked(postId: string, liked: boolean): PostStats {
  session.isLoggedInOrThrow();
  let userId = session.getOrThrow("userId");

  if (liked) {
    sql(`
      insert into likes (postId, userId) values (${postId}::uuid, ${userId}::uuid)
      on conflict (postId, userId) do nothing
    `);
  } else {
    sql(`delete from likes where postId = ${postId}::uuid and userId = ${userId}::uuid`);
  }

  return publishStats(postId);
}

/** @rpc */
export function deletePost(postId: string) {
  session.isLoggedInOrThrow();

  let gone = sql<{ imageId: string | null }>(`
    delete from posts where id = ${postId}::uuid and userId = ${session.getOrThrow("userId")}::uuid
    returning imageId
  `).first();

  if (!gone) {
    throw new NotFoundError("post not found");
  }

  if (gone.imageId) {
    sql(`delete from images where id = ${gone.imageId}::uuid`);
  }
}
