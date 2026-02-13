import type { NextAuthConfig } from "next-auth";

// This config is Edge-compatible (no Node.js modules, no database imports).
// Used by middleware for route protection.
export default {
  providers: [], // Providers are added in auth.ts (server-only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as unknown as { role: "ADMIN" | "STAFF" | "CLIENT" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "STAFF" | "CLIENT";
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;

      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");
      const isDashboard =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/leads") ||
        nextUrl.pathname.startsWith("/tickets") ||
        nextUrl.pathname.startsWith("/contacts") ||
        nextUrl.pathname.startsWith("/announcements") ||
        nextUrl.pathname.startsWith("/settings");
      const isPortal = nextUrl.pathname.startsWith("/portal");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isApi = nextUrl.pathname.startsWith("/api/");

      if (isApiAuth || isApi) return true;

      if (isAuthPage) {
        if (isLoggedIn) {
          const redirect = role === "CLIENT" ? "/portal" : "/dashboard";
          return Response.redirect(new URL(redirect, nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (isDashboard && role === "CLIENT") {
        return Response.redirect(new URL("/portal", nextUrl));
      }
      if (isPortal && (role === "ADMIN" || role === "STAFF")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
