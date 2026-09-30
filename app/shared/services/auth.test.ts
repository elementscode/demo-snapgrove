import { test, assert, equal, session, AuthError, ValidationError } from "@elements/app";
import { signin, signup } from "#app/shared/services/auth";
import { makeUser } from "#app/shared/services/fixtures";

test("signin", () => {
  test("accepts an email or a handle", () => {
    let grace = makeUser("grace", "correct horse");

    signin(grace.email.toUpperCase(), "correct horse");
    equal(session.get("userName"), grace.handle);

    session.logout();
    signin(`@${grace.handle}`, "correct horse");
    equal(session.get("userName"), grace.handle);
  });

  test("rejects a wrong password", () => {
    let grace = makeUser("grace", "correct horse");

    let threw = false;
    try {
      signin(grace.handle, "battery staple");
    } catch (err) {
      threw = true;
      assert(err instanceof AuthError, `got ${err}`);
    }

    assert(threw);
    equal(session.isLoggedIn(), false);
  });
});

test("signup reports each bad field", () => {
  let taken = makeUser("taken");

  let threw = false;
  try {
    signup({ handle: taken.handle, name: "", email: "not-an-email", password: "short" });
  } catch (err: any) {
    threw = true;
    assert(err instanceof ValidationError, `got ${err}`);
    assert(err.errors?.email && err.errors?.password, "email and password errors");
  }

  assert(threw);
});
