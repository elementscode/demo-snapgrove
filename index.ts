import { App } from "@elements/app";
import config from "#config";
import home from "#app/pages/home";
import signin from "#app/pages/signin";
import signup from "#app/pages/signup";
import post from "#app/pages/post";
import explore from "#app/pages/explore";
import profile from "#app/pages/profile";
import notifications from "#app/pages/notifications";
import newPost from "#app/pages/new-post";
import settings from "#app/pages/settings";
import serveImage from "#app/routes/images";
import notFound from "#app/pages/errors/not-found";
import unhandled from "#app/pages/errors/unhandled";

const app = new App();

app.route("/", home);
app.route("/signin", signin);
app.route("/signup", signup);
app.route("/p/:id", post);
app.route("/explore", explore);
app.route("/u/:handle", profile);
app.route("/notifications", notifications);
app.route("/new", newPost);
app.route("/settings", settings);
app.route("/images/:id/:hash", serveImage);

app.error((req, res, err) => {
  switch (err.statusCode) {
    case 404:
      return notFound(req, res, err);

    default:
      return unhandled(req, res, err);
  }
});

app.start(config);
