export type ConversationChannel = "sms" | "whatsapp" | "webchat";
export type ConversationStatus = "active" | "closed" | "archived";
export type MessageDirection = "inbound" | "outbound";
export type MessageDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "undelivered";

export interface ConversationRecord {
  sid: string;
  friendlyName?: string | null;
  state: ConversationStatus;
  attributes?: Record<string, unknown>;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface ParticipantRecord {
  sid: string;
  conversationSid: string;
  identity?: string | null;
  bindingAddress?: string | null;
  proxyAddress?: string | null;
  attributes?: Record<string, unknown>;
}

export interface MessageRecord {
  sid: string;
  conversationSid: string;
  author?: string | null;
  body?: string | null;
  mediaUrls: string[];
  index: number;
  dateCreated: Date;
  dateUpdated: Date;
  attributes?: Record<string, unknown>;
}

export interface SendMessageInput {
  conversationSid: string;
  body?: string;
  author?: string;
  mediaUrl?: string;
  attributes?: Record<string, unknown>;
}

export interface CreateConversationInput {
  friendlyName?: string;
  attributes?: Record<string, unknown>;
  uniqueName?: string;
}

export interface AddSmsParticipantInput {
  conversationSid: string;
  toPhoneNumber: string;
  proxyPhoneNumber?: string;
  channel?: ConversationChannel;
}

export interface AddChatParticipantInput {
  conversationSid: string;
  identity: string;
  attributes?: Record<string, unknown>;
}

export class TwilioNotConfiguredError extends Error {
  constructor(message = "Twilio is not configured") {
    super(message);
    this.name = "TwilioNotConfiguredError";
  }
}

export class TwilioDryRunSkip extends Error {
  constructor(message = "Skipped due to LEAD_PIPELINE_DRY_RUN=true") {
    super(message);
    this.name = "TwilioDryRunSkip";
  }
}
