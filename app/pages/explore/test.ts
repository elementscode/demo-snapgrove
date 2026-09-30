import { test, equal, sql } from "@elements/app";
import { explorePosts } from "#app/shared/services/posts";
import { makeUser, makePost } from "#app/shared/services/fixtures";

test("explore ranks recent posts by likes and comments", () => {
  let me = makeUser("me");
  let quiet = makePost(me, "quiet", 10);
  let liked = makePost(me, "liked", 20);
  let discussed = makePost(me, "discussed", 30);
  let old = makePost(me, "old", 60 * 24 * 20);

  // The ranking is over the whole table and capped, so these scores start
  // far above any seeded post; the test then reads back only its own.
  let base = 1_000_000;
  sql(`update posts set likeCount = ${base} where id = ${quiet}::uuid`);
  sql(`update posts set likeCount = ${base + 3} where id = ${liked}::uuid`);
  sql(`update posts set likeCount = ${base}, commentCount = 2 where id = ${discussed}::uuid`);
  sql(`update posts set likeCount = ${base + 99} where id = ${old}::uuid`);

  let mine = new Set([quiet, liked, discussed, old]);
  equal(explorePosts(me.id).filter((p) => mine.has(p.id)).map((p) => p.caption).join(" | "), "discussed | liked | quiet");
});
