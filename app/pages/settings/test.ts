import { test, assert, equal, sql, ValidationError } from "@elements/app";
import { updateProfile, MAX_BIO } from "#app/shared/services/uploads";
import { makeUser, signIn } from "#app/shared/services/fixtures";

test("settings", () => {
  test("saves the name and bio", () => {
    let me = makeUser("me");
    signIn(me);

    updateProfile({ name: " Maya ", bio: "hills and light" });

    let u = sql<{ name: string; bio: string }>(`select name, bio from users where id = ${me.id}::uuid`).firstOrThrow();
    equal(u.name, "Maya");
    equal(u.bio, "hills and light");
  });

  test("refuses a bio that is too long", () => {
    let me = makeUser("me");
    signIn(me);

    let threw = false;
    try {
      updateProfile({ name: "", bio: "x".repeat(MAX_BIO + 1) });
    } catch (err) {
      threw = true;
      assert(err instanceof ValidationError, `got ${err}`);
    }

    assert(threw);
  });
});
