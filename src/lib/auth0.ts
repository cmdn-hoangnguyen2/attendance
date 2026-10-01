import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";

let client: Auth0Client | undefined;
function getAuth0Client(): Auth0Client {
  if (client) return client;
  const required = ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET", "AUTH0_SECRET", "APP_BASE_URL"] as const;
  for (const name of required) {
    if (!process.env[name]?.trim()) throw new Error(`Missing required authentication configuration: ${name}`);
  }
  const appBaseUrl = new URL(process.env.APP_BASE_URL!);
  if (!["http:", "https:"].includes(appBaseUrl.protocol)) throw new Error("APP_BASE_URL must be an HTTP(S) URL");
  client = new Auth0Client({
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    secret: process.env.AUTH0_SECRET!,
    appBaseUrl: appBaseUrl.origin,
    authorizationParameters: {
      prompt: "select_account",
      connection: process.env.AUTH0_CONNECTION || "google-oauth2",
      scope: "openid profile email",
    },
    enableAccessTokenEndpoint: false,
  });
  return client;
}
// Configuration is validated on first SDK access, never during unrelated imports.
export const auth0 = {
  getSession: () => getAuth0Client().getSession(),
  middleware: (request: Request) => getAuth0Client().middleware(request),
};
