import { test, equal, session, sql } from "@elements/app";
import { signup } from "#app/shared/services/auth";

test("signup creates the account and signs it in", () => {
  signup({ handle: "@NewPerson", name: "New Person", email: "New@Example.com", password: "long enough" });

  let u = sql<{ handle: string; email: string }>(`select handle, email from users`).firstOrThrow();

  equal(u.handle, "newperson");
  equal(u.email, "new@example.com");
  equal(session.get("userName"), "newperson");
});
