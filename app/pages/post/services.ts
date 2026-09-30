import { LiveTable, ForbiddenError, ValidationError, session, sql } from "@elements/app";
import { publishStats } from "#app/shared/services/posts";

export interface Comment {
  id: string;
  createdAt: Date;
  postId: string;
  userId: string;
  body: string;
  handle: string;
  name: string;
  avatarSeed: string | null;
  avatarImageId: string | null;
  avatarHash: string | null;
  avatarUrl?: string;
}

export const MAX_COMMENT = 1000;

function readComment(id: string): Comment {
  return sql<Comment>(`
    select c.id, c.createdAt, c.postId, c.userId, c.body,
           u.handle, u.name, u.avatarSeed, u.avatarImageId, ai.hash as avatarHash
      from comments c
      join users u on u.id = c.userId
      left join images ai on ai.id = u.avatarImageId
     where c.id = ${id}::uuid
  `).firstOrThrow("comment not found");
}

export let comments: LiveTable<Comment> = new LiveTable<Comment>({
  select: ({ postId }) => sql<Comment>(`
    select c.id, c.createdAt, c.postId, c.userId, c.body,
           u.handle, u.name, u.avatarSeed, u.avatarImageId, ai.hash as avatarHash
      from comments c
      join users u on u.id = c.userId
      left join images ai on ai.id = u.avatarImageId
     where c.postId = ${postId}::uuid
     order by c.createdAt, c.id
  `),

  // The author is always the session, and the row that goes out carries their
  // handle and avatar so every open copy of the post can draw it.
  insert: (item) => {
    session.isLoggedInOrThrow();

    let body = (item.body ?? "").trim();
    if (!body) {
      throw new ValidationError("write something first");
    }

    if (body.length > MAX_COMMENT) {
      throw new ValidationError(`comments are at most ${MAX_COMMENT} characters`);
    }

    sql(`
      insert into comments (id, postId, userId, body)
           values (${item.id}::uuid, ${item.postId}::uuid, ${session.getOrThrow("userId")}::uuid, ${body})
    `);

    publishStats(item.postId!);

    return readComment(item.id!);
  },

  update: () => { throw new ForbiddenError(); },

  // The comment's author or the post's owner can remove it.
  delete: (item) => {
    session.isLoggedInOrThrow();
    let me = session.getOrThrow("userId");

    let row = sql<{ userId: string; ownerId: string }>(`
      select c.userId, p.userId as ownerId
        from comments c join posts p on p.id = c.postId
       where c.id = ${item.id}::uuid
    `).first();

    if (!row) {
      return;
    }

    if (row.userId !== me && row.ownerId !== me) {
      throw new ForbiddenError();
    }

    sql(`delete from comments where id = ${item.id}::uuid`);
    publishStats(item.postId);
  },
});
