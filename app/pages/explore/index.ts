import { Request, Response, redirect, sql } from "@elements/app";
import { currentUser } from "#app/shared/services/auth";
import { openNotifications } from "#app/shared/services/notifications";
import { postStats, explorePosts } from "#app/shared/services/posts";
import html, { Person } from "./template";

export default function route(req: Request, res: Response) {
  let me = currentUser();
  if (!me) {
    redirect("/signin");
    return;
  }

  let stats = postStats.listen();

  // Everyone who has posted lately, most active first.
  let people = sql<Person>(`
    select u.id, u.handle, u.name, u.avatarSeed, u.avatarImageId, ai.hash as avatarHash
      from users u
      left join images ai on ai.id = u.avatarImageId
     where u.id <> ${me.id}::uuid
     order by (select max(createdAt) from posts p where p.userId = u.id) desc nulls last
     limit 16
  `).all();

  return new html({
    me,
    notes: openNotifications(me.id),
    stats,
    posts: explorePosts(me.id),
    people,
  });
}
