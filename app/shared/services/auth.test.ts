import { test, assert, equal, session, AuthError, ValidationError } from "@elements/app";
import { signin, signup } from "#app/shared/services/auth";
import { makeUser } from "#app/shared/services/fixtures";

test("signin", () => {
  test("accepts an email or a handle", () => {
    makeUser("grace", "correct horse");

    signin("GRACE@test.dev", "correct horse");
    equal(session.get("userName"), "grace");

    session.logout();
    signin("@grace", "correct horse");
    equal(session.get("userName"), "grace");
  });

  test("rejects a wrong password", () => {
    makeUser("grace", "correct horse");

    let threw = false;
    try {
      signin("grace", "battery staple");
    } catch (err) {
      threw = true;
      assert(err instanceof AuthError, `got ${err}`);
    }

    assert(threw);
    equal(session.isLoggedIn(), false);
  });
});

test("signup reports each bad field", () => {
  makeUser("taken");

  let threw = false;
  try {
    signup({ handle: "taken", name: "", email: "not-an-email", password: "short" });
  } catch (err: any) {
    threw = true;
    assert(err instanceof ValidationError, `got ${err}`);
    assert(err.errors?.email && err.errors?.password, "email and password errors");
  }

  assert(threw);
});
