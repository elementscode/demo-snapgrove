import { Request, Response, redirect, sql } from "@elements/app";
import { currentUser, DEMO_HANDLES } from "#app/shared/services/auth";
import html, { DemoAccount } from "./template";

export default function route(req: Request, res: Response) {
  if (currentUser()) {
    redirect("/");
    return;
  }

  let demo = sql<DemoAccount>(`
    select id, handle, name, email, avatarSeed from users where handle = any(${DEMO_HANDLES})
  `).all();

  demo.sort((a, b) => DEMO_HANDLES.indexOf(a.handle) - DEMO_HANDLES.indexOf(b.handle));

  return new html({ demo });
}
