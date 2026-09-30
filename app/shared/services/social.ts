import { sql, session, ValidationError } from "@elements/app";

export interface FollowCounts {
  following: boolean;
  followers: number;
}

/** @rpc */
export function setFollowing(userId: string, follow: boolean): FollowCounts {
  session.isLoggedInOrThrow();
  let me = session.getOrThrow("userId");

  if (me === userId) {
    throw new ValidationError("you can't follow yourself");
  }

  if (follow) {
    sql(`
      insert into follows (followerId, followeeId) values (${me}::uuid, ${userId}::uuid)
      on conflict (followerId, followeeId) do nothing
    `);
  } else {
    sql(`delete from follows where followerId = ${me}::uuid and followeeId = ${userId}::uuid`);
  }

  let n = sql<{ n: number }>(`
    select count(*)::int as n from follows where followeeId = ${userId}::uuid
  `).firstOrThrow();

  return { following: follow, followers: n.n };
}
