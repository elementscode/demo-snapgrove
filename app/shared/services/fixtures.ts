import { sql, session } from "@elements/app";

export interface TestUser {
  id: string;
  handle: string;
  email: string;
}

/**
 * A user with a cheap hash, so a test can make several without waiting on
 * bcrypt. The handle gets a random suffix, so test files running in parallel
 * never insert the same unique handle or email.
 */
export function makeUser(handle: string, password: string = "password1"): TestUser {
  let unique = `${handle}_${crypto.randomUUID().slice(0, 8)}`;

  return sql<TestUser>(`
    insert into users (email, passwordHash, handle, name)
         values (${unique + "@test.dev"}, crypt(${password}, genSalt('bf', 4)), ${unique}, ${handle})
      returning id, handle, email
  `).firstOrThrow();
}

export function makePost(user: TestUser, caption: string = "", minutesAgo: number = 0): string {
  return sql<{ id: string }>(`
    insert into posts (userId, seedPhoto, caption, createdAt)
         values (${user.id}::uuid, 'photo-10', ${caption}, now() - make_interval(mins => ${minutesAgo}))
      returning id
  `).firstOrThrow().id;
}

export function follow(a: TestUser, b: TestUser) {
  sql(`insert into follows (followerId, followeeId) values (${a.id}::uuid, ${b.id}::uuid)`);
}

export function signIn(u: TestUser) {
  session.login({ userId: u.id, userName: u.handle });
}

export function notesFor(u: TestUser): { kind: string; actorId: string; readAt: Date | null }[] {
  return sql<{ kind: string; actorId: string; readAt: Date | null }>(`
    select kind, actorId, readAt from notifications where userId = ${u.id}::uuid order by createdAt
  `).all();
}
