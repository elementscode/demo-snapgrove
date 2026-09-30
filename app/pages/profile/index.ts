import { Request, Response, redirect, sql } from "@elements/app";
import { currentUser } from "#app/shared/services/auth";
import { openNotifications } from "#app/shared/services/notifications";
import { postStats, userPosts } from "#app/shared/services/posts";
import html, { Profile } from "./template";

export default function route(req: Request, res: Response) {
  let me = currentUser();
  if (!me) {
    redirect("/signin");
    return;
  }

  let stats = postStats.listen();

  let profile = sql<Profile>(`
    select u.id, u.handle, u.name, u.bio, u.avatarSeed, u.avatarImageId, ai.hash as avatarHash,
           (select count(*)::int from follows where followeeId = u.id) as followers,
           (select count(*)::int from follows where followerId = u.id) as following,
           exists (select 1 from follows where followerId = ${me.id}::uuid and followeeId = u.id) as followedByMe,
           exists (select 1 from follows where followerId = u.id and followeeId = ${me.id}::uuid) as followsMe
      from users u
      left join images ai on ai.id = u.avatarImageId
     where u.handle = ${String(req.params.handle).toLowerCase()}
  `).firstOrThrow("no one goes by that handle");

  return new html({
    me,
    notes: openNotifications(me.id),
    stats,
    profile,
    posts: userPosts(profile.id, me.id),
  });
}
