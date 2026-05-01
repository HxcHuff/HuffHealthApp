"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  X,
  Link2,
} from "lucide-react";
import { MESSAGE_TEMPLATES, applyTemplateVariables, smsSegmentCount } from "@/lib/twilio/message-templates";

interface ConversationListItem {
  id: string;
  twilioConversationSid: string;
  channel: "SMS" | "WHATSAPP" | "WEBCHAT";
  status: "ACTIVE" | "CLOSED" | "ARCHIVED";
  participantPhone: string | null;
  unreadCount: number;
  lastMessageAt: string | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    insuranceType: string | null;
    dateOfBirth: string | null;
    zipCode: string | null;
    status: string;
  } | null;
  messages: Array<{ id: string; body: string | null; direction: "INBOUND" | "OUTBOUND"; sentAt: string }>;
}

interface MessageItem {
  id: string;
  body: string | null;
  direction: "INBOUND" | "OUTBOUND";
  sentAt: string;
  deliveryStatus: string | null;
  mediaUrl: string | null;
  mediaUrls: string[];
}

interface ConsentStatus {
  type: string;
  given: boolean;
  revokedAt: string | null;
  consentedAt: string;
}

interface ConversationDetails {
  conversation: Omit<ConversationListItem, "messages"> & { messages: MessageItem[] };
  consentStatus: ConsentStatus | null;
}

interface Props {
  initialConversations: ConversationListItem[];
  initialUnreadCount: number;
}

export function ConversationsWorkspace({ initialConversations, initialUnreadCount }: Props) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations);
  const [totalUnread, setTotalUnread] = useState(initialUnreadCount);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "CLOSED">("ACTIVE");
  const [channelFilter, setChannelFilter] = useState<"" | "SMS" | "WHATSAPP" | "WEBCHAT">("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedSid, setSelectedSid] = useState<string | null>(
    initialConversations[0]?.twilioConversationSid ?? null,
  );
  const [details, setDetails] = useState<ConversationDetails | null>(null);
  const [composerBody, setComposerBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (channelFilter && c.channel !== channelFilter) return false;
      if (unreadOnly && c.unreadCount === 0) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = c.lead ? `${c.lead.firstName} ${c.lead.lastName}`.toLowerCase() : "";
        const phone = (c.participantPhone ?? "").toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [conversations, statusFilter, channelFilter, unreadOnly, search]);

  const refreshList = useCallback(async () => {
    const url = new URL("/api/conversations", window.location.origin);
    if (statusFilter) url.searchParams.set("status", statusFilter);
    if (channelFilter) url.searchParams.set("channel", channelFilter);
    if (unreadOnly) url.searchParams.set("unreadOnly", "true");
    if (search) url.searchParams.set("search", search);
    const res = await fetch(url.toString());
    if (res.ok) {
      const data = (await res.json()) as { conversations: ConversationListItem[]; totalUnread: number };
      setConversations(data.conversations);
      setTotalUnread(data.totalUnread);
    }
  }, [statusFilter, channelFilter, unreadOnly, search]);

  const loadDetails = useCallback(async (sid: string) => {
    const res = await fetch(`/api/conversations/${sid}`);
    if (!res.ok) return;
    const data = (await res.json()) as ConversationDetails;
    setDetails(data);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    setConversations((prev) =>
      prev.map((c) => (c.twilioConversationSid === sid ? { ...c, unreadCount: 0 } : c)),
    );
  }, []);

  useEffect(() => {
    if (selectedSid) loadDetails(selectedSid);
  }, [selectedSid, loadDetails]);

  // Real-time updates: prefer SSE, fall back to polling.
  useEffect(() => {
    let pollFallback: ReturnType<typeof setInterval> | null = null;
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/conversations/stream");
      es.addEventListener("update", () => {
        refreshList();
        if (selectedSid) loadDetails(selectedSid);
      });
      es.onerror = () => {
        es?.close();
        if (!pollFallback) {
          pollFallback = setInterval(() => {
            refreshList();
            if (selectedSid) loadDetails(selectedSid);
          }, 5000);
        }
      };
    } catch {
      pollFallback = setInterval(() => {
        refreshList();
        if (selectedSid) loadDetails(selectedSid);
      }, 5000);
    }
    return () => {
      es?.close();
      if (pollFallback) clearInterval(pollFallback);
    };
  }, [refreshList, loadDetails, selectedSid]);

  const handleSend = async () => {
    if (!selectedSid || !composerBody.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/conversations/${selectedSid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: composerBody }),
      });
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok || data.error) {
        setSendError(data.error ?? "Failed to send");
      } else {
        setComposerBody("");
        await loadDetails(selectedSid);
        await refreshList();
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!selectedSid) return;
    if (!confirm("Close this conversation?")) return;
    await fetch(`/api/conversations/${selectedSid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    await refreshList();
    if (selectedSid) loadDetails(selectedSid);
  };

  const applyTemplate = (templateId: string) => {
    const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (!template || !details?.conversation.lead) {
      if (template) setComposerBody(template.body);
      return;
    }
    const lead = details.conversation.lead;
    const filled = applyTemplateVariables(template.body, {
      firstName: lead.firstName,
      lastName: lead.lastName,
      city: "Lakeland",
      planType: "your selected",
      carrierName: "your carrier",
      effectiveDate: "your start date",
      documentList: "ID, proof of income, and SSN",
    });
    setComposerBody(filled);
  };

  const sendEnrollmentLink = async () => {
    if (!selectedSid) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/conversations/${selectedSid}/enrollment-link`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setSendError(data.error ?? "Failed to send enrollment link");
      } else {
        await loadDetails(selectedSid);
        await refreshList();
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const stageDocumentRequest = () => {
    if (!details?.conversation.lead) return;
    const lead = details.conversation.lead;
    setComposerBody(
      `Hi ${lead.firstName}, to complete your enrollment I'll need: ID, proof of income, and SSN. You can text photos of these documents directly to this number, or email them to dhuff@healthmarkets.com. Let me know if you have questions.`,
    );
  };

  const insuranceIsMedicare =
    details?.conversation.lead?.insuranceType?.startsWith("MEDICARE") ||
    details?.conversation.lead?.insuranceType === "PART_D";

  const consentBadge = (() => {
    if (!details?.conversation.lead) return null;
    if (insuranceIsMedicare) {
      return { color: "bg-blue-100 text-blue-800", label: "Medicare — SOA required", icon: AlertTriangle };
    }
    if (!details.consentStatus) {
      return { color: "bg-red-100 text-red-800", label: "No consent on file", icon: AlertTriangle };
    }
    if (!details.consentStatus.given) {
      return { color: "bg-red-100 text-red-800", label: "Consent revoked", icon: AlertTriangle };
    }
    return {
      color: "bg-green-100 text-green-800",
      label: "TCPA consent valid",
      icon: CheckCircle2,
    };
  })();

  const segmentCount = composerBody ? smsSegmentCount(composerBody) : 0;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      <aside className="flex w-96 flex-col rounded-lg border border-gray-200 bg-white">
        <header className="border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </h2>
            {totalUnread > 0 ? (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {totalUnread}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or phone"
              className="flex-1 bg-transparent py-1.5 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <select
              className="rounded border border-gray-200 px-2 py-1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | "ACTIVE" | "CLOSED")}
            >
              <option value="">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              className="rounded border border-gray-200 px-2 py-1"
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(e.target.value as "" | "SMS" | "WHATSAPP" | "WEBCHAT")
              }
            >
              <option value="">All channels</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="WEBCHAT">Web</option>
            </select>
            <label className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
              />
              Unread only
            </label>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">No conversations.</p>
          ) : (
            filtered.map((c) => {
              const name = c.lead ? `${c.lead.firstName} ${c.lead.lastName}` : c.participantPhone ?? "Unknown";
              const preview = c.messages[0]?.body ?? "(no messages)";
              const isSelected = c.twilioConversationSid === selectedSid;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedSid(c.twilioConversationSid)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-gray-100 px-3 py-3 text-left transition",
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      c.unreadCount > 0 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700",
                    )}
                  >
                    {c.lead ? getInitials(name) : <Smartphone className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                      <span className="shrink-0 text-xs text-gray-500">
                        {c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : ""}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-600">{preview}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">
                        {c.channel}
                      </span>
                      {c.unreadCount > 0 ? (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 font-bold text-white">
                          {c.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
        {!details ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
            Select a conversation
          </div>
        ) : (
          <>
            <header className="border-b border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {details.conversation.lead
                        ? `${details.conversation.lead.firstName} ${details.conversation.lead.lastName}`
                        : details.conversation.participantPhone ?? "Unknown"}
                    </h3>
                    {details.conversation.lead ? (
                      <Link
                        href={`/leads/${details.conversation.lead.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View lead →
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    {details.conversation.lead?.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {details.conversation.lead.phone}
                      </span>
                    ) : null}
                    {details.conversation.lead?.zipCode ? (
                      <span>ZIP {details.conversation.lead.zipCode}</span>
                    ) : null}
                    {details.conversation.lead?.insuranceType ? (
                      <span>{details.conversation.lead.insuranceType}</span>
                    ) : null}
                    {details.conversation.lead?.status ? (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5">{details.conversation.lead.status}</span>
                    ) : null}
                  </div>
                  {consentBadge ? (
                    <div className="mt-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          consentBadge.color,
                        )}
                      >
                        <consentBadge.icon className="h-3 w-3" />
                        {consentBadge.label}
                      </span>
                    </div>
                  ) : null}
                </div>
                {details.conversation.status === "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-3 w-3" />
                    Close
                  </button>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {details.conversation.status}
                  </span>
                )}
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
              {details.conversation.messages.length === 0 ? (
                <p className="text-center text-sm text-gray-500">No messages yet.</p>
              ) : (
                details.conversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.direction === "OUTBOUND" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                        m.direction === "OUTBOUND"
                          ? "rounded-br-sm bg-blue-500 text-white"
                          : "rounded-bl-sm bg-white text-gray-900",
                      )}
                    >
                      {m.body ? <p className="whitespace-pre-wrap">{m.body}</p> : null}
                      {m.mediaUrls?.length ? (
                        <div className="mt-2 space-y-1">
                          {m.mediaUrls.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs underline"
                            >
                              View attachment
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <div
                        className={cn(
                          "mt-1 flex items-center gap-1 text-[10px]",
                          m.direction === "OUTBOUND" ? "text-blue-100" : "text-gray-500",
                        )}
                      >
                        <span>{formatRelativeTime(m.sentAt)}</span>
                        {m.direction === "OUTBOUND" && m.deliveryStatus ? (
                          <span>· {m.deliveryStatus.toLowerCase()}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="border-t border-gray-200 p-3">
              {consentBadge?.label === "No consent on file" ||
              consentBadge?.label === "Consent revoked" ? (
                <div className="mb-2 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    No valid TCPA consent on file. Outbound sends will be blocked by compliance.
                  </span>
                </div>
              ) : null}
              {insuranceIsMedicare ? (
                <div className="mb-2 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Medicare lead — automated outbound is blocked. Replies to inbound only.
                  </span>
                </div>
              ) : null}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <select
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                  onChange={(e) => {
                    if (e.target.value) applyTemplate(e.target.value);
                    e.target.value = "";
                  }}
                  defaultValue=""
                >
                  <option value="">Insert template…</option>
                  {Object.entries(
                    MESSAGE_TEMPLATES.reduce<Record<string, typeof MESSAGE_TEMPLATES>>(
                      (acc, t) => {
                        acc[t.category] = acc[t.category] ?? [];
                        acc[t.category].push(t);
                        return acc;
                      },
                      {},
                    ),
                  ).map(([cat, tpls]) => (
                    <optgroup key={cat} label={cat.replace("_", " ")}>
                      {tpls.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={sendEnrollmentLink}
                  disabled={sending}
                  className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Link2 className="h-3 w-3" />
                  Send enrollment link
                </button>
                <button
                  type="button"
                  onClick={stageDocumentRequest}
                  className="flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Doc request
                </button>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={composerBody}
                  onChange={(e) => setComposerBody(e.target.value)}
                  placeholder="Type a message…"
                  rows={3}
                  className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  disabled={details.conversation.status !== "ACTIVE"}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !composerBody.trim() || details.conversation.status !== "ACTIVE"}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {composerBody.length} chars{segmentCount > 0 ? ` · ${segmentCount} segment${segmentCount > 1 ? "s" : ""}` : ""}
                </span>
                {sendError ? <span className="text-red-600">{sendError}</span> : null}
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
