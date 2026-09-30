import { sql, session, AuthError, ValidationError } from "@elements/app";
import { avatarUrl } from "#app/shared/services/photos";

export interface Me {
  id: string;
  handle: string;
  name: string;
  avatarUrl: string;
}

export interface SignupForm {
  handle: string;
  name: string;
  email: string;
  password: string;
}

export const MIN_PASSWORD = 8;

/**
 * The seeded accounts, listed on the sign-in page. They exist only in
 * development: the seed migration is tagged `@env development`.
 */
export const DEMO_PASSWORD = "snapgrove";

export const DEMO_HANDLES = ["maya", "theo", "priya", "jonas", "lena", "sam", "ada", "kai"];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * The signed-in user, or undefined. A session whose user no longer exists (the
 * development database was reset under it) is ended here, so the sign-in page
 * does not bounce it back home.
 */
export function currentUser(): Me | undefined {
  let id = session.get("userId");
  if (!id) {
    return undefined;
  }

  let u = sql<Me & { avatarImageId: string | null; avatarHash: string | null; avatarSeed: string | null }>(`
    select u.id, u.handle, u.name, u.avatarImageId, i.hash as avatarHash, u.avatarSeed
      from users u
      left join images i on i.id = u.avatarImageId
     where u.id = ${id}::uuid
  `).first();

  if (!u) {
    session.logout();
    return undefined;
  }

  return { id: u.id, handle: u.handle, name: u.name, avatarUrl: avatarUrl(u) };
}

/** @rpc */
export function signin(login: string, password: string) {
  let who = normalize(login).replace(/^@/, "");

  if (!who || !password) {
    throw new AuthError("enter your email or handle and your password");
  }

  let user = sql<{ id: string; handle: string }>(`
    select id, handle from users
     where (email = ${who} or handle = ${who})
       and passwordHash = crypt(${password}, passwordHash)
  `).first();

  if (!user) {
    throw new AuthError("that login and password don't match");
  }

  session.login({ userId: user.id, userName: user.handle });
}

/** @rpc */
export function signup(form: SignupForm) {
  let handle = normalize(form.handle).replace(/^@/, "");
  let email = normalize(form.email);
  let name = form.name.trim();

  let errors: Record<string, string[]> = {};

  if (!/^[a-z0-9_]{2,24}$/.test(handle)) {
    errors.handle = ["2 to 24 letters, numbers or underscores"];
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.email = ["enter a valid email address"];
  }

  if (form.password.length < MIN_PASSWORD) {
    errors.password = [`at least ${MIN_PASSWORD} characters`];
  }

  if (Object.keys(errors).length === 0) {
    if (!sql(`select 1 from users where handle = ${handle}`).empty()) {
      errors.handle = ["that handle is taken"];
    }

    if (!sql(`select 1 from users where email = ${email}`).empty()) {
      errors.email = ["that email is already registered"];
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  let user = sql<{ id: string }>(`
    insert into users (email, passwordHash, handle, name)
         values (${email}, crypt(${form.password}, genSalt('bf', 12)), ${handle}, ${name || handle})
      returning id
  `).firstOrThrow();

  session.login({ userId: user.id, userName: handle });
}

/** @rpc */
export function signout() {
  session.logout();
}
