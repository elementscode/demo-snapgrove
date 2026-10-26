![Photo sharing with a live feed, built by Claude Code on Elements: a snowy mountain photo with its comment thread, a comment arriving live, likes, and more photos from the same person.](https://elements.dev/demos/01a0f40c-730d-7aa6-bc9e-b238cdce284b/poster?v=7ff91a8af400)

# Photo sharing with a live feed, built by Claude Code on Elements

> Snapgrove is a full-stack app built with Claude Code on Elements.

Profiles with a grid of photos, follows, a home feed that keeps scrolling, likes and comments that update live, notifications, and an explore page.

[Run this app on your machine](https://elements.dev/demos/01a0f40c-730d-7aa6-bc9e-b238cdce284b). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Snapgrove needed photo uploads, a feed that keeps loading as you scroll, likes and comments that show up on every open copy of a post, and a notification badge that fills in on its own. Each of those is a part of Elements, so the agent spent its 23 minutes on the app itself.

- **A feed that keeps scrolling.** The home feed is a LiveTable for each reader, read with a keyset window, so it loads six posts at a time as you scroll.

- **Live comments and notifications.** Comments and notifications are LiveTables. A comment appears on every open copy of the post as it is written, and database triggers on likes, comments and follows fill the notification badge.

- **Live counts.** A channel pushes each post's like and comment counts to every page showing it.

- **Photo uploads as function calls.** The new post page sends the photo to an `@rpc` as a `File`, the app stores it in the database, and a route serves each image under its content hash with a year-long cache.

- **Data from SQL files.** Two migrations define the schema and its triggers, then seed eight friends who follow each other, 50 photo posts, 209 likes, 88 comments and a few unread notifications each, with the seed photos shipped as image assets.

- **Sessions.** Every change runs as the signed-in user, so a like or a comment always carries the right name.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
