import { getTwilioClient, readTwilioEnv, isDryRun, isTwilioConfigured } from "./client";
import { maskPhone } from "./signature";
import type {
  ConversationRecord,
  ParticipantRecord,
  MessageRecord,
  SendMessageInput,
  CreateConversationInput,
  AddSmsParticipantInput,
  AddChatParticipantInput,
  ConversationStatus,
} from "./types";
import { TwilioDryRunSkip, TwilioNotConfiguredError } from "./types";

function ensureService() {
  const env = readTwilioEnv();
  if (!env) throw new TwilioNotConfiguredError();
  return { client: getTwilioClient(), env };
}

function parseAttributes(raw: string | null | undefined): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function toConversation(c: {
  sid: string;
  friendlyName: string | null;
  state: string;
  attributes: string | null;
  dateCreated: Date;
  dateUpdated: Date;
}): ConversationRecord {
  return {
    sid: c.sid,
    friendlyName: c.friendlyName ?? null,
    state: (c.state as ConversationStatus) ?? "active",
    attributes: parseAttributes(c.attributes),
    dateCreated: c.dateCreated,
    dateUpdated: c.dateUpdated,
  };
}

function toMessage(m: {
  sid: string;
  conversationSid: string;
  author: string | null;
  body: string | null;
  media: Array<{ Sid?: string; sid?: string; url?: string }> | null;
  index: number;
  dateCreated: Date;
  dateUpdated: Date;
  attributes: string | null;
}): MessageRecord {
  const mediaUrls = Array.isArray(m.media)
    ? m.media.map((entry) => entry.url ?? "").filter(Boolean)
    : [];
  return {
    sid: m.sid,
    conversationSid: m.conversationSid,
    author: m.author ?? null,
    body: m.body ?? null,
    mediaUrls,
    index: m.index,
    dateCreated: m.dateCreated,
    dateUpdated: m.dateUpdated,
    attributes: parseAttributes(m.attributes),
  };
}

export async function createConversation(
  input: CreateConversationInput = {},
): Promise<ConversationRecord> {
  if (isDryRun()) {
    console.info(
      `[twilio] DRY_RUN createConversation friendlyNameLen=${input.friendlyName?.length ?? 0}`,
    );
    throw new TwilioDryRunSkip();
  }
  const { client, env } = ensureService();
  const conversation = await client.conversations.v1
    .services(env.conversationsServiceSid)
    .conversations.create({
      friendlyName: input.friendlyName,
      uniqueName: input.uniqueName,
      attributes: input.attributes ? JSON.stringify(input.attributes) : undefined,
      messagingServiceSid: env.messagingServiceSid,
    });
  return toConversation(conversation);
}

export async function getConversation(sid: string): Promise<ConversationRecord> {
  const { client, env } = ensureService();
  const conversation = await client.conversations.v1
    .services(env.conversationsServiceSid)
    .conversations(sid)
    .fetch();
  return toConversation(conversation);
}

export async function updateConversationState(
  sid: string,
  state: ConversationStatus,
): Promise<ConversationRecord> {
  if (isDryRun()) {
    console.info("[twilio] DRY_RUN updateConversationState", { sid, state });
    throw new TwilioDryRunSkip();
  }
  const { client, env } = ensureService();
  const twilioState = state === "archived" ? "closed" : state;
  const conversation = await client.conversations.v1
    .services(env.conversationsServiceSid)
    .conversations(sid)
    .update({ state: twilioState as "active" | "inactive" | "closed" });
  return toConversation(conversation);
}

export async function addSmsParticipant(
  input: AddSmsParticipantInput,
): Promise<ParticipantRecord> {
  if (isDryRun()) {
    console.info(
      `[twilio] DRY_RUN addSmsParticipant convo=${input.conversationSid} to=${maskPhone(input.toPhoneNumber)} channel=${input.channel ?? "sms"}`,
    );
    throw new TwilioDryRunSkip();
  }
  const { client, env } = ensureService();
  const proxyPrefix = input.channel === "whatsapp" ? "whatsapp:" : "";
  const proxy = input.proxyPhoneNumber ?? env.phoneNumber;
  const participant = await client.conversations.v1
    .services(env.conversationsServiceSid)
    .conversations(input.conversationSid)
    .participants.create({
      "messagingBinding.address": `${proxyPrefix}${input.toPhoneNumber}`,
      "messagingBinding.proxyAddress": `${proxyPrefix}${proxy}`,
    });
  return {
    sid: participant.sid,
    conversationSid: participant.conversationSid,
    identity: participant.identity ?? null,
    bindingAddress: input.toPhoneNumber,
    proxyAddress: proxy,
    attributes: parseAttributes(participant.attributes),
  };
}

export async function addChatParticipant(
  input: AddChatParticipantInput,
): Promise<ParticipantRecord> {
  if (isDryRun()) {
    console.info(
      `[twilio] DRY_RUN addChatParticipant convo=${input.conversationSid} identity=${input.identity}`,
    );
    throw new TwilioDryRunSkip();
  }
  const { client, env } = ensureService();
  const participant = await client.conversations.v1
    .services(env.conversationsServiceSid)
    .conversations(input.conversationSid)
    .participants.create({
      identity: input.identity,
      attributes: input.attributes ? JSON.stringify(input.attributes) : undefined,
    });
  return {
    sid: participant.sid,
    conversationSid: participant.conversationSid,
    identity: participant.identity ?? null,
    bindingAddress: null,
    proxyAddress: null,
    attributes: parseAttributes(participant.attributes),
  };
}

export async function sendMessage(input: SendMessageInput): Promise<MessageRecord> {
  if (isDryRun()) {
    console.info(
      `[twilio] DRY_RUN sendMessage convo=${input.conversationSid} bodyLen=${input.body?.length ?? 0}`,
    );
    throw new TwilioDryRunSkip();
  }
  const { client, env } = ensureService();
  const message = await client.conversations.v1
    .services(env.conversationsServiceSid)
    .conversations(input.conversationSid)
    .messages.create({
      body: input.body,
      author: input.author,
      mediaSid: undefined,
      attributes: input.attributes ? JSON.stringify(input.attributes) : undefined,
    });
  return toMessage(message as unknown as Parameters<typeof toMessage>[0]);
}

export async function listMessages(
  conversationSid: string,
  options: { limit?: number; pageSize?: number } = {},
): Promise<MessageRecord[]> {
  const { client, env } = ensureService();
  const messages = await client.conversations.v1
    .services(env.conversationsServiceSid)
    .conversations(conversationSid)
    .messages.list({
      limit: options.limit ?? 100,
      pageSize: options.pageSize ?? 50,
    });
  return messages.map((m) => toMessage(m as unknown as Parameters<typeof toMessage>[0]));
}

export async function deleteConversation(sid: string): Promise<void> {
  if (isDryRun()) {
    console.info("[twilio] DRY_RUN deleteConversation", { sid });
    return;
  }
  const { client, env } = ensureService();
  await client.conversations.v1
    .services(env.conversationsServiceSid)
    .conversations(sid)
    .remove();
}

export { isTwilioConfigured, isDryRun };
