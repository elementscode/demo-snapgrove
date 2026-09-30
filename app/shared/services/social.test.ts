import { test, assert, equal, sql } from "@elements/app";
import { setLiked } from "#app/shared/services/posts";
import { setFollowing } from "#app/shared/services/social";
import { markAllRead } from "#app/shared/services/notifications";
import { makeUser, makePost, signIn, notesFor } from "#app/shared/services/fixtures";

function likeCount(postId: string): number {
  return sql<{ likeCount: number }>(`select likeCount from posts where id = ${postId}::uuid`).firstOrThrow().likeCount;
}

test("likes", () => {
  test("count, notify the owner, and undo cleanly", () => {
    let owner = makeUser("owner");
    let fan = makeUser("fan");
    let post = makePost(owner);

    signIn(fan);

    equal(setLiked(post, true).likeCount, 1);
    equal(setLiked(post, true).likeCount, 1, "liking twice is still one like");
    equal(notesFor(owner).map((n) => n.kind).join(), "like");

    equal(setLiked(post, false).likeCount, 0);
    equal(likeCount(post), 0);
    equal(notesFor(owner).length, 0, "unliking removes the notification");
  });

  test("liking your own post does not notify you", () => {
    let owner = makeUser("owner");
    let post = makePost(owner);

    signIn(owner);
    setLiked(post, true);

    equal(notesFor(owner).length, 0);
  });
});

test("follows", () => {
  test("notify, count, and unfollow removes the notification", () => {
    let a = makeUser("alpha");
    let b = makeUser("bravo");

    signIn(a);

    equal(setFollowing(b.id, true).followers, 1);
    equal(notesFor(b)[0]?.actorId, a.id);

    equal(setFollowing(b.id, false).followers, 0);
    equal(notesFor(b).length, 0);
  });

  test("mark all read clears only the caller's", () => {
    let a = makeUser("alpha");
    let b = makeUser("bravo");

    signIn(a);
    setFollowing(b.id, true);
    signIn(b);
    setFollowing(a.id, true);

    markAllRead();

    assert(notesFor(b).every((n) => n.readAt !== null), "bravo's are read");
    assert(notesFor(a).every((n) => n.readAt === null), "alpha's are untouched");
  });
});
