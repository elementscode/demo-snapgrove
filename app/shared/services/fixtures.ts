import { sql, session } from "@elements/app";

export interface TestUser {
  id: string;
  handle: string;
}

/** A user with a cheap hash, so a test can make several without waiting on bcrypt. */
export function makeUser(handle: string, password: string = "password1"): TestUser {
  return sql<TestUser>(`
    insert into users (email, passwordHash, handle, name)
         values (${handle + "@test.dev"}, crypt(${password}, genSalt('bf', 4)), ${handle}, ${handle})
      returning id, handle
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
