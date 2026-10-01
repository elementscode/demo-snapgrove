![Snapgrove, a photo sharing app built with Elements: a snowy mountain photo with its comment thread, a comment arriving live, likes, and more photos from the same person.](https://elements.dev/demos/01a0f40c-730d-7aa6-bc9e-b238cdce284b/poster?v=7ff91a8af400)

# Snapgrove

> A demo app built with [Elements](https://elements.dev).

Profiles with a grid of photos, follows, a home feed that keeps scrolling, likes and comments that update live, notifications, and an explore page.

**Demo:** [Snapgrove](https://elements.dev/demos/01a0f40c-730d-7aa6-bc9e-b238cdce284b)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 23 min
- **Cost:** $6.79 at API rates, September 2026

## Get started

```bash
elements create snapgrove -scaffold=elementscode/demo-snapgrove
```

## How it's built

Snapgrove needed photo uploads, a feed that keeps loading as you scroll, likes and comments that show up on every open copy of a post, and a notification badge that fills in on its own. Each of those is a part of Elements, so the agent spent its 23 minutes on the app itself.

### What Elements gave the app

- **A feed that keeps scrolling.** The home feed is a LiveTable for each reader, read with a keyset window, so it loads six posts at a time as you scroll.
- **Live comments and notifications.** Comments and notifications are LiveTables. A comment appears on every open copy of the post as it is written, and database triggers on likes, comments and follows fill the notification badge.
- **Live counts.** A channel pushes each post's like and comment counts to every page showing it.
- **Photo uploads as function calls.** The new post page sends the photo to an `@rpc` as a `File`, the app stores it in the database, and a route serves each image under its content hash with a year-long cache.
- **Data from SQL files.** Two migrations define the schema and its triggers, then seed eight friends who follow each other, 50 photo posts, 209 likes, 88 comments and a few unread notifications each, with the seed photos shipped as image assets.
- **Sessions.** Every change runs as the signed-in user, so a like or a comment always carries the right name.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 23 tests pass. Every page works on desktop and phone, and live updates arrive across tabs, such as likes, comments and the notification badge.

## Demo accounts

The seed creates eight people who all follow each other, fifty photo posts,
likes, comments, and a few unread notifications for each account. Every
account's password is `snapgrove`, and the sign-in page lists them.

| Email                | Name           |
| -------------------- | -------------- |
| maya@snapgrove.dev   | Maya Okafor    |
| theo@snapgrove.dev   | Theo Lindqvist |
| priya@snapgrove.dev  | Priya Raman    |
| jonas@snapgrove.dev  | Jonas Weber    |
| lena@snapgrove.dev   | Lena Park      |
| sam@snapgrove.dev    | Sam Rivera     |
| ada@snapgrove.dev    | Ada Mensah     |
| kai@snapgrove.dev    | Kai Nakamura   |

The seed photos and avatars in `app/shared/assets/seed/` are CC0 photos from
StockSnap, cropped and compressed.

## The prompt

```text
Build a photo sharing app named snapgrove.

- Sign up, profile with avatar, bio and a grid of your posts.
- Post a photo with a caption.
- Follow people. A home feed of posts from people you follow, newest first,
  with infinite scroll.
- Like and comment on posts.
- Notifications for new followers, likes and comments.
- An explore page of popular recent posts.

Seed eight users who follow each other, fifty photo posts with likes and
comments. Show the seeded logins on the sign-in page.

Likes, comments and notifications update in real time.
```

## License

MIT. See [LICENSE](LICENSE).
