import { Request, Response, redirect } from "@elements/app";
import { currentUser } from "#app/shared/services/auth";
import { openNotifications } from "#app/shared/services/notifications";
import { postStats } from "#app/shared/services/posts";
import html from "./template";
import { feedPosts, FEED_PAGE } from "./services";

export default function route(req: Request, res: Response) {
  let me = currentUser();
  if (!me) {
    redirect("/signin");
    return;
  }

  return new html({
    me,
    notes: openNotifications(me.id),
    stats: postStats.listen(),
    posts: feedPosts.view({ viewerId: me.id }, { orderBy: "createdAt desc", limit: FEED_PAGE }),
  });
}
