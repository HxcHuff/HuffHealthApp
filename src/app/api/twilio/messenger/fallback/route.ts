import { POST as webhookPost } from "../webhook/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Same handler as incoming webhook. Used as Twilio's Facebook Sender fallback URL. */
export const POST = webhookPost;
