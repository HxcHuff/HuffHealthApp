import {
  isDryRun,
  mailchimpFetch,
  readMailchimpEnv,
  subscriberHash,
} from "./client";
import type {
  TagSubscriberInput,
  TagSubscriberResult,
  UpsertSubscriberInput,
  UpsertSubscriberResult,
} from "./types";

/**
 * Upsert a subscriber into the configured Mailchimp audience. Uses
 * PUT /lists/{list_id}/members/{subscriber_hash}, which creates or updates
 * idempotently. Tags are applied in a follow-up call when provided.
 */
export async function upsertSubscriber(
  input: UpsertSubscriberInput,
): Promise<UpsertSubscriberResult> {
  const email = input.email?.trim();
  if (!email) {
    return { status: "skipped_no_email" };
  }

  if (isDryRun()) {
    console.info(
      `[mailchimp] DRY_RUN upsert email=${email} tags=${JSON.stringify(input.tags ?? [])}`,
    );
    return { status: "skipped_dry_run", subscriberHash: subscriberHash(email) };
  }

  const env = readMailchimpEnv();
  if (!env) {
    console.warn(
      `[mailchimp] credentials not configured, skipping upsert for ${email}`,
    );
    return { status: "skipped_no_credentials" };
  }

  const hash = subscriberHash(email);
  const body = {
    email_address: email,
    status_if_new: input.status ?? "subscribed",
    merge_fields: input.mergeFields ?? {},
  };

  const upsert = await mailchimpFetch<{ id?: string }>(
    env,
    `/lists/${env.audienceId}/members/${hash}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );

  if (!upsert.ok) {
    console.error(
      `[mailchimp] upsert failed for ${email}: ${upsert.status} ${upsert.error ?? ""}`,
    );
    return {
      status: "failed",
      httpStatus: upsert.status,
      error: upsert.error,
      subscriberHash: hash,
    };
  }

  if (input.tags && input.tags.length > 0) {
    const tagResult = await tagSubscriber({ email, add: input.tags });
    if (tagResult.status === "failed") {
      return {
        status: "failed",
        httpStatus: tagResult.httpStatus,
        error: `tag_failed: ${tagResult.error ?? ""}`,
        subscriberHash: hash,
      };
    }
  }

  return { status: "upserted", subscriberHash: hash, httpStatus: upsert.status };
}

/**
 * Add and/or remove tags on a Mailchimp subscriber.
 */
export async function tagSubscriber(
  input: TagSubscriberInput,
): Promise<TagSubscriberResult> {
  const email = input.email?.trim();
  if (!email) {
    return { status: "skipped_no_email" };
  }
  const adds = input.add ?? [];
  const removes = input.remove ?? [];
  if (adds.length === 0 && removes.length === 0) {
    return { status: "tagged" };
  }

  if (isDryRun()) {
    console.info(
      `[mailchimp] DRY_RUN tag email=${email} add=${JSON.stringify(adds)} remove=${JSON.stringify(removes)}`,
    );
    return { status: "skipped_dry_run" };
  }

  const env = readMailchimpEnv();
  if (!env) {
    return { status: "skipped_no_credentials" };
  }

  const hash = subscriberHash(email);
  const tags = [
    ...adds.map((name) => ({ name, status: "active" as const })),
    ...removes.map((name) => ({ name, status: "inactive" as const })),
  ];

  const res = await mailchimpFetch<unknown>(
    env,
    `/lists/${env.audienceId}/members/${hash}/tags`,
    {
      method: "POST",
      body: JSON.stringify({ tags }),
    },
  );

  if (!res.ok) {
    return { status: "failed", httpStatus: res.status, error: res.error };
  }
  return { status: "tagged", httpStatus: res.status };
}
