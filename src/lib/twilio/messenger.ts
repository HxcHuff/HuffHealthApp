import twilio from "twilio";
import { db } from "@/lib/db";

/** Page: David the Insurance Dude - HealthMarkets Insurance Agency */
export const FACEBOOK_PAGE_ID_DEFAULT = "1068037236387352";
export const FACEBOOK_PAGE_NAME_DEFAULT =
  "David the Insurance Dude - HealthMarkets Insurance Agency";
export const MESSENGER_ADDRESS_PREFIX = "messenger:";
export const MESSENGER_LEAD_SOURCE = "facebook_messenger";

export function getFacebookPageId(): string {
  return (
    process.env.TWILIO_FACEBOOK_PAGE_ID?.trim() ||
    process.env.FACEBOOK_MESSENGER_PAGE_ID?.trim() ||
    FACEBOOK_PAGE_ID_DEFAULT
  );
}

export function isMessengerAddress(value?: string | null): boolean {
  if (!value) return false;
  return value.trim().toLowerCase().startsWith(MESSENGER_ADDRESS_PREFIX);
}

export function parseMessengerId(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase().startsWith(MESSENGER_ADDRESS_PREFIX)) {
    const id = trimmed.slice(MESSENGER_ADDRESS_PREFIX.length).trim();
    return id || null;
  }
  if (/^\d{5,}$/.test(trimmed)) return trimmed;
  return null;
}

export function toMessengerAddress(idOrAddress: string): string {
  const id = parseMessengerId(idOrAddress);
  if (!id) {
    throw new Error(`Invalid Messenger address: ${idOrAddress}`);
  }
  return `${MESSENGER_ADDRESS_PREFIX}${id}`;
}

/** Stable Hopper thread key for a Facebook PSID. Not a Twilio Conversations SID. */
export function messengerConversationSid(psid: string): string {
  const id = parseMessengerId(psid);
  if (!id) throw new Error("Cannot build Messenger conversation sid without a PSID");
  return `CHmessenger_${id}`;
}

export function detectChannelFromAddress(
  address?: string | null,
): "sms" | "whatsapp" | "webchat" | "facebook_messenger" {
  if (!address) return "sms";
  const lower = address.trim().toLowerCase();
  if (lower.startsWith(MESSENGER_ADDRESS_PREFIX)) return "facebook_messenger";
  if (lower.startsWith("whatsapp:")) return "whatsapp";
  return "sms";
}

export function parseMessengerProfileName(profileName?: string | null): {
  firstName: string;
  lastName: string;
} {
  const raw = (profileName ?? "").trim();
  if (!raw) return { firstName: "Facebook", lastName: "Messenger" };
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: "Messenger" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function emptyTwiml(): string {
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>";
}

function getMessengerTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Twilio Account SID and Auth Token are required to send Messenger");
  }
  return twilio(accountSid, authToken);
}

export interface SendFacebookMessengerInput {
  toPsid: string;
  body: string;
  statusCallbackUrl?: string;
}

export interface SendFacebookMessengerResult {
  sid: string;
  from: string;
  to: string;
}

/**
 * Send on the Facebook Messenger channel only.
 * Never uses Messaging Service SID / From phone — that would be SMS.
 */
export async function sendFacebookMessengerMessage(
  input: SendFacebookMessengerInput,
): Promise<SendFacebookMessengerResult> {
  const to = toMessengerAddress(input.toPsid);
  const from = toMessengerAddress(getFacebookPageId());
  if (parseMessengerId(to) === parseMessengerId(from)) {
    throw new Error("Refusing to send Messenger message to the Page ID itself");
  }

  const client = getMessengerTwilioClient();
  const message = await client.messages.create({
    from,
    to,
    body: input.body,
    statusCallback: input.statusCallbackUrl,
  });

  console.info(
    `[twilio-messenger] sent sid=${message.sid} from=${from} to=messenger:***${parseMessengerId(to)?.slice(-4)}`,
  );

  return { sid: message.sid, from, to };
}

export async function findLeadIdByFacebookPsid(psid: string): Promise<string | null> {
  const byField = await db.lead.findFirst({
    where: {
      customFields: {
        path: ["facebookPsid"],
        equals: psid,
      },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  if (byField) return byField.id;

  const byThread = await db.conversation.findFirst({
    where: {
      channel: "FACEBOOK_MESSENGER",
      participantPhone: toMessengerAddress(psid),
      leadId: { not: null },
    },
    select: { leadId: true },
    orderBy: { createdAt: "desc" },
  });
  return byThread?.leadId ?? null;
}

export async function findOrCreateMessengerLead(args: {
  psid: string;
  pageId?: string | null;
  profileName?: string | null;
}): Promise<string | null> {
  const existing = await findLeadIdByFacebookPsid(args.psid);
  if (existing) return existing;

  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) return null;

  const name = parseMessengerProfileName(args.profileName);
  const pageId = args.pageId || getFacebookPageId();

  const created = await db.lead.create({
    data: {
      firstName: name.firstName,
      lastName: name.lastName,
      // Never invent a phone from a Messenger PSID. SMS requires TCPA + a real number.
      phone: null,
      status: "NEW_LEAD",
      source: MESSENGER_LEAD_SOURCE,
      sourceCategory: "ORGANIC",
      priority: "WARM",
      createdById: admin.id,
      customFields: {
        facebookPsid: args.psid,
        facebookPageId: pageId,
        facebookPageName: FACEBOOK_PAGE_NAME_DEFAULT,
        channel: "facebook_messenger",
      },
      leadEvents: {
        create: {
          type: "CREATED",
          payload: {
            source: MESSENGER_LEAD_SOURCE,
            facebookPsid: args.psid,
            facebookPageId: pageId,
          },
        },
      },
    },
    select: { id: true },
  });
  return created.id;
}
