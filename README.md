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
