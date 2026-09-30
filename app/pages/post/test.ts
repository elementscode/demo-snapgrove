import { test, assert, equal, sql, AuthError, ForbiddenError } from "@elements/app";
import { comments } from "./services";
import { makeUser, makePost, signIn, notesFor } from "#app/shared/services/fixtures";

test("comments", () => {
  test("carry the author, bump the count and notify the owner", () => {
    let owner = makeUser("owner");
    let fan = makeUser("fan");
    let post = makePost(owner);

    signIn(fan);
    let thread = comments.view({ postId: post });
    let c = thread.insert({ body: "  lovely  " });

    equal(c.body, "lovely");
    equal(c.handle, "fan");
    equal(sql<{ commentCount: number }>(`select commentCount from posts where id = ${post}::uuid`).firstOrThrow().commentCount, 1);
    equal(notesFor(owner).map((n) => n.kind).join(), "comment");
  });

  test("are refused from an anonymous visitor", () => {
    let owner = makeUser("owner");
    let post = makePost(owner);

    let threw = false;
    try {
      comments.view({ postId: post }).insert({ body: "hi" });
    } catch (err) {
      threw = true;
      assert(err instanceof AuthError, `got ${err}`);
    }

    assert(threw);
  });

  test("can be deleted by their author but not by a stranger", () => {
    let owner = makeUser("owner");
    let fan = makeUser("fan");
    let stranger = makeUser("stranger");
    let post = makePost(owner);

    signIn(fan);
    let c = comments.view({ postId: post }).insert({ body: "mine" });

    signIn(stranger);
    let threw = false;
    try {
      comments.view({ postId: post }).delete(c);
    } catch (err) {
      threw = true;
      assert(err instanceof ForbiddenError, `got ${err}`);
    }

    assert(threw);

    signIn(fan);
    comments.view({ postId: post }).delete(c);
    equal(sql(`select 1 from comments where postId = ${post}::uuid`).all().length, 0);
  });
});
