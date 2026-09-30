import { Request, Response, redirect, sql } from "@elements/app";
import { currentUser } from "#app/shared/services/auth";
import { openNotifications } from "#app/shared/services/notifications";
import html from "./template";

export default function route(req: Request, res: Response) {
  let me = currentUser();
  if (!me) {
    redirect("/signin");
    return;
  }

  let { bio } = sql<{ bio: string }>(`select bio from users where id = ${me.id}::uuid`).firstOrThrow();

  return new html({ me, notes: openNotifications(me.id), bio });
}
