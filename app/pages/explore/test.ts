import { test, equal, sql } from "@elements/app";
import { explorePosts } from "#app/shared/services/posts";
import { makeUser, makePost } from "#app/shared/services/fixtures";

test("explore ranks recent posts by likes and comments", () => {
  let me = makeUser("me");
  makePost(me, "quiet", 10);
  let liked = makePost(me, "liked", 20);
  let discussed = makePost(me, "discussed", 30);
  let old = makePost(me, "old", 60 * 24 * 20);

  sql(`update posts set likeCount = 3 where id = ${liked}::uuid`);
  sql(`update posts set commentCount = 2 where id = ${discussed}::uuid`);
  sql(`update posts set likeCount = 99 where id = ${old}::uuid`);

  equal(explorePosts(me.id).map((p) => p.caption).join(" | "), "discussed | liked | quiet");
});
