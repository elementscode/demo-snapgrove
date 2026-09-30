import { test, equal } from "@elements/app";
import { feedPosts } from "./services";
import { makeUser, makePost, follow } from "#app/shared/services/fixtures";

test("home feed", () => {
  test("shows your posts and the people you follow, newest first", () => {
    let me = makeUser("me");
    let friend = makeUser("friend");
    let stranger = makeUser("stranger");

    follow(me, friend);

    makePost(friend, "old friend post", 60);
    makePost(stranger, "stranger post", 1);
    makePost(me, "my post", 30);
    makePost(friend, "new friend post", 5);

    let feed = feedPosts.view({ viewerId: me.id }, { orderBy: "createdAt desc", limit: 10 });

    equal(feed.map((p) => p.caption).join(" | "), "new friend post | my post | old friend post");
  });

  test("pages by the window", () => {
    let me = makeUser("me");

    for (let i = 0; i < 5; i++) {
      makePost(me, `post ${i}`, i);
    }

    let feed = feedPosts.view({ viewerId: me.id }, { orderBy: "createdAt desc", limit: 2 });

    equal(feed.length, 2);
    equal(feed.hasMore, true);
  });
});
