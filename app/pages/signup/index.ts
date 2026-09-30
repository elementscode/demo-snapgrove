import { Request, Response, redirect } from "@elements/app";
import { currentUser } from "#app/shared/services/auth";
import html from "./template";

export default function route(req: Request, res: Response) {
  if (currentUser()) {
    redirect("/");
    return;
  }

  return new html();
}
