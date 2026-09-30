import { test, assert, equal, ValidationError } from "@elements/app";
import { userPosts } from "#app/shared/services/posts";
import { setFollowing } from "#app/shared/services/social";
import { makeUser, makePost, signIn } from "#app/shared/services/fixtures";

test("profile", () => {
  test("lists only that person's posts, newest first", () => {
    let a = makeUser("alpha");
    let b = makeUser("bravo");

    makePost(a, "first", 20);
    makePost(b, "not mine", 10);
    makePost(a, "second", 5);

    equal(userPosts(a.id, b.id).map((p) => p.caption).join(), "second,first");
  });

  test("you cannot follow yourself", () => {
    let a = makeUser("alpha");
    signIn(a);

    let threw = false;
    try {
      setFollowing(a.id, true);
    } catch (err) {
      threw = true;
      assert(err instanceof ValidationError, `got ${err}`);
    }

    assert(threw);
  });
});
