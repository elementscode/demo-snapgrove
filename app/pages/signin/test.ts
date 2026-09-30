import { test, equal, session } from "@elements/app";
import { currentUser } from "#app/shared/services/auth";
import { makeUser, signIn } from "#app/shared/services/fixtures";

test("signin page", () => {
  test("knows the signed-in user", () => {
    let u = makeUser("ada");
    signIn(u);

    equal(currentUser()?.handle, "ada");
  });

  test("ends a session whose user is gone", () => {
    session.login({ userId: "01a0f3e4-0000-7000-8000-000000000000", userName: "ghost" });

    equal(currentUser(), undefined);
    equal(session.isLoggedIn(), false);
  });
});
