import { Request, Response, redirect } from "@elements/app";
import { currentUser } from "#app/shared/services/auth";
import { openNotifications } from "#app/shared/services/notifications";
import { postStats, readPost, userPosts } from "#app/shared/services/posts";
import html from "./template";
import { comments } from "./services";

export default function route(req: Request, res: Response) {
  let me = currentUser();
  if (!me) {
    redirect("/signin");
    return;
  }

  let stats = postStats.listen();
  let post = readPost(req.params.id, me.id);
  let more = userPosts(post.userId, me.id).filter((p) => p.id !== post.id).slice(0, 6);

  return new html({
    me,
    notes: openNotifications(me.id),
    stats,
    post,
    thread: comments.view({ postId: post.id }),
    more,
  });
}
