import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { sharePage } from "./share";

const http = httpRouter();
auth.addHttpRoutes(http);

// Link previews for shared content; the web server forwards crawler requests
// for /events/<slug> and /blog/<slug> here (see docs/SHARING.md)
http.route({ pathPrefix: "/share/events/", method: "GET", handler: sharePage });
http.route({ pathPrefix: "/share/blog/", method: "GET", handler: sharePage });

export default http;
