import { test, equal } from "@elements/app";
import { openNotifications } from "#app/shared/services/notifications";
import { setLiked } from "#app/shared/services/posts";
import { makeUser, makePost, signIn, follow } from "#app/shared/services/fixtures";

test("notifications arrive newest first with the actor and the photo", () => {
  let me = makeUser("me");
  let fan = makeUser("fan");
  let post = makePost(me, "sunset");

  follow(fan, me);
  signIn(fan);
  setLiked(post, true);

  let notes = openNotifications(me.id);

  equal(notes.map((n) => n.kind).join(), "like,follow");
  equal(notes.at(0)?.handle, "fan");
  equal(notes.at(0)?.seedPhoto, "photo-10");
  equal(notes.at(1)?.postId, null);
});
