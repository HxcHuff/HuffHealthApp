import { describe, it, expect } from "vitest";
import {
  FACEBOOK_PAGE_ID_DEFAULT,
  detectChannelFromAddress,
  isMessengerAddress,
  messengerConversationSid,
  parseMessengerId,
  parseMessengerProfileName,
  toMessengerAddress,
} from "../twilio/messenger";

describe("messenger addresses", () => {
  it("parses messenger:PSID and raw numeric ids", () => {
    expect(parseMessengerId("messenger:1234567890")).toBe("1234567890");
    expect(parseMessengerId("MESSENGER:1234567890")).toBe("1234567890");
    expect(parseMessengerId("1234567890")).toBe("1234567890");
    expect(parseMessengerId("+18632707035")).toBeNull();
    expect(parseMessengerId("whatsapp:+18632707035")).toBeNull();
  });

  it("never treats an SMS number as Messenger", () => {
    expect(isMessengerAddress("+18632707035")).toBe(false);
    expect(detectChannelFromAddress("+18632707035")).toBe("sms");
    expect(detectChannelFromAddress("whatsapp:+18632707035")).toBe("whatsapp");
    expect(detectChannelFromAddress("messenger:999")).toBe("facebook_messenger");
  });

  it("builds a stable Hopper thread key from PSID", () => {
    expect(messengerConversationSid("messenger:1068")).toBe("CHmessenger_1068");
    expect(toMessengerAddress("555")).toBe("messenger:555");
  });

  it("uses the connected HealthMarkets page id by default", () => {
    expect(FACEBOOK_PAGE_ID_DEFAULT).toBe("1068037236387352");
  });

  it("splits a Facebook profile name without inventing a phone", () => {
    expect(parseMessengerProfileName("Jane Q Public")).toEqual({
      firstName: "Jane",
      lastName: "Q Public",
    });
    expect(parseMessengerProfileName(null)).toEqual({
      firstName: "Facebook",
      lastName: "Messenger",
    });
  });
});
