import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Use the lightweight Edge-compatible config (no db, no Node.js modules)
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
};
