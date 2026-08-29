export type HopperConversationChannel =
  | "SMS"
  | "WHATSAPP"
  | "WEBCHAT"
  | "FACEBOOK_MESSENGER";

export function conversationChannelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case "FACEBOOK_MESSENGER":
      return "Messenger";
    case "WHATSAPP":
      return "WhatsApp";
    case "WEBCHAT":
      return "Web";
    case "SMS":
      return "SMS";
    default:
      return channel || "Unknown";
  }
}
