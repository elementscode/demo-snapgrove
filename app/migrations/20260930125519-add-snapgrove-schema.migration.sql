-- add snapgrove schema

-- Auto-update updatedAt on row changes.
create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

-- Uploaded bytes: post photos and avatars. The hash goes in the url so the
-- serve route can cache forever.
create table images (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  contentType text not null,
  data bytea not null,
  hash text generated always as (encode(sha256(data), 'hex')) stored
);

create trigger imagesTouchUpdatedAt
  before update on images
  for each row execute function touchUpdatedAt();

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null unique,
  passwordHash text not null,
  handle text not null unique check (handle ~ '^[a-z0-9_]{2,24}$'),
  name text not null default '',
  bio text not null default '',
  avatarImageId uuid references images(id) on delete set null,
  -- A photo shipped with the app, for the seeded accounts.
  avatarSeed text
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table posts (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  userId uuid not null references users(id) on delete cascade,
  imageId uuid references images(id) on delete cascade,
  seedPhoto text,
  caption text not null default '',
  -- Kept by the likes and comments triggers below, so a feed page never
  -- counts rows.
  likeCount integer not null default 0,
  commentCount integer not null default 0,
  check (imageId is not null or seedPhoto is not null)
);

create index postsUserIdx on posts (userId, createdAt desc, id desc);
create index postsCreatedAtIdx on posts (createdAt desc, id desc);

create trigger postsTouchUpdatedAt
  before update on posts
  for each row execute function touchUpdatedAt();

create table follows (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  followerId uuid not null references users(id) on delete cascade,
  followeeId uuid not null references users(id) on delete cascade,
  unique (followerId, followeeId),
  check (followerId <> followeeId)
);

create index followsFolloweeIdx on follows (followeeId);

create trigger followsTouchUpdatedAt
  before update on follows
  for each row execute function touchUpdatedAt();

create table likes (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  postId uuid not null references posts(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  unique (postId, userId)
);

create index likesUserIdx on likes (userId);

create trigger likesTouchUpdatedAt
  before update on likes
  for each row execute function touchUpdatedAt();

create table comments (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  postId uuid not null references posts(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  body text not null check (length(body) between 1 and 1000)
);

create index commentsPostIdx on comments (postId, createdAt);

create trigger commentsTouchUpdatedAt
  before update on comments
  for each row execute function touchUpdatedAt();

create table notifications (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  userId uuid not null references users(id) on delete cascade,
  actorId uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('follow', 'like', 'comment')),
  postId uuid references posts(id) on delete cascade,
  commentId uuid references comments(id) on delete cascade,
  readAt timestamptz
);

create index notificationsUserIdx on notifications (userId, createdAt desc, id desc);

create trigger notificationsTouchUpdatedAt
  before update on notifications
  for each row execute function touchUpdatedAt();

-- Notifications are written here rather than in the app, so a like from the
-- seed, an rpc or psql all reach the owner the same way.
create or replace function likesAfterWrite() returns trigger
language plpgsql as $$
declare
  owner uuid;
begin
  if tg_op = 'INSERT' then
    update posts set likeCount = likeCount + 1 where id = new.postId returning userId into owner;

    if owner <> new.userId then
      insert into notifications (userId, actorId, kind, postId, createdAt)
           values (owner, new.userId, 'like', new.postId, new.createdAt);
    end if;

    return new;
  end if;

  update posts set likeCount = greatest(likeCount - 1, 0) where id = old.postId;
  delete from notifications
   where kind = 'like' and actorId = old.userId and postId = old.postId;

  return old;
end;
$$;

create trigger likesAfterWriteTrigger
  after insert or delete on likes
  for each row execute function likesAfterWrite();

create or replace function commentsAfterWrite() returns trigger
language plpgsql as $$
declare
  owner uuid;
begin
  if tg_op = 'INSERT' then
    update posts set commentCount = commentCount + 1 where id = new.postId returning userId into owner;

    if owner <> new.userId then
      insert into notifications (userId, actorId, kind, postId, commentId, createdAt)
           values (owner, new.userId, 'comment', new.postId, new.id, new.createdAt);
    end if;

    return new;
  end if;

  update posts set commentCount = greatest(commentCount - 1, 0) where id = old.postId;

  return old;
end;
$$;

create trigger commentsAfterWriteTrigger
  after insert or delete on comments
  for each row execute function commentsAfterWrite();

create or replace function followsAfterWrite() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications (userId, actorId, kind, createdAt)
         values (new.followeeId, new.followerId, 'follow', new.createdAt);

    return new;
  end if;

  delete from notifications
   where kind = 'follow' and actorId = old.followerId and userId = old.followeeId;

  return old;
end;
$$;

create trigger followsAfterWriteTrigger
  after insert or delete on follows
  for each row execute function followsAfterWrite();

-- Every notification write notifies the table's channel and reaches the
-- recipient's open pages. The payload is only the id: each app server reads
-- the row back through the LiveTable's select, which joins in the actor and
-- the post photo.
create or replace function notificationsNotify() returns trigger
language plpgsql as $$
declare
  r record;
begin
  r := coalesce(new, old);

  perform pg_notify(
    channel_name('notifications'),
    json_build_object('op', lower(tg_op), 'id', r.id)::text
  );

  return r;
end;
$$;

create trigger notificationsNotifyTrigger
  after insert or update or delete on notifications
  for each row execute function notificationsNotify();
