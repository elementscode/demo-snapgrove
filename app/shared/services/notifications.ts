import { LiveTable, ForbiddenError, sql, session } from "@elements/app";

export interface Note {
  id: string;
  createdAt: Date;
  userId: string;
  actorId: string;
  kind: "follow" | "like" | "comment";
  postId: string | null;
  readAt: Date | null;
  handle: string;
  name: string;
  avatarSeed: string | null;
  avatarImageId: string | null;
  avatarHash: string | null;
  seedPhoto: string | null;
  imageId: string | null;
  imageHash: string | null;
  commentBody: string | null;
}

export const NOTE_PAGE = 20;

/**
 * Rows are written by triggers on likes, comments and follows, and a trigger
 * on notifications announces each one by id on the table's channel. The
 * select below is how each app server reads the full row back.
 */
export let notifications: LiveTable<Note> = new LiveTable<Note>({
  select: ({ userId }, w) => sql<Note>(`
    select n.id, n.createdAt, n.userId, n.actorId, n.kind, n.postId, n.readAt,
           a.handle, a.name, a.avatarSeed, a.avatarImageId, ai.hash as avatarHash,
           p.seedPhoto, p.imageId, pi.hash as imageHash, c.body as commentBody
      from notifications n
      join users a on a.id = n.actorId
      left join images ai on ai.id = a.avatarImageId
      left join posts p on p.id = n.postId
      left join images pi on pi.id = p.imageId
      left join comments c on c.id = n.commentId
     where n.userId = ${userId}::uuid and ${w.keyset("n")}
     order by ${w.order("n")} ${w.page()}
  `),

  insert: () => { throw new ForbiddenError(); },
  update: () => { throw new ForbiddenError(); },
  delete: () => { throw new ForbiddenError(); },
});

export function openNotifications(userId: string) {
  return notifications.view({ userId }, { orderBy: "createdAt desc", limit: NOTE_PAGE });
}

/** @rpc */
export function markAllRead() {
  session.isLoggedInOrThrow();

  sql(`
    update notifications set readAt = now()
     where userId = ${session.getOrThrow("userId")}::uuid and readAt is null
  `);
}
