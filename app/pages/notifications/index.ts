import { Request, Response, redirect } from "@elements/app";
import { currentUser } from "#app/shared/services/auth";
import { openNotifications } from "#app/shared/services/notifications";
import html from "./template";

export default function route(req: Request, res: Response) {
  let me = currentUser();
  if (!me) {
    redirect("/signin");
    return;
  }

  return new html({ me, notes: openNotifications(me.id) });
}
