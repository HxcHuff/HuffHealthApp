export type MailchimpSubscriberStatus =
  | "subscribed"
  | "unsubscribed"
  | "cleaned"
  | "pending"
  | "transactional";

export interface MailchimpMergeFields {
  FNAME?: string;
  LNAME?: string;
  PHONE?: string;
  ADDRESS?: string;
  ZIP?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface UpsertSubscriberInput {
  email: string;
  status?: MailchimpSubscriberStatus;
  mergeFields?: MailchimpMergeFields;
  tags?: string[];
}

export interface UpsertSubscriberResult {
  status:
    | "upserted"
    | "skipped_dry_run"
    | "skipped_no_credentials"
    | "skipped_no_email"
    | "failed";
  subscriberHash?: string;
  error?: string;
  httpStatus?: number;
}

export interface TagSubscriberInput {
  email: string;
  add?: string[];
  remove?: string[];
}

export interface TagSubscriberResult {
  status:
    | "tagged"
    | "skipped_dry_run"
    | "skipped_no_credentials"
    | "skipped_no_email"
    | "failed";
  error?: string;
  httpStatus?: number;
}

export class MailchimpNotConfiguredError extends Error {
  constructor(message = "Mailchimp is not configured") {
    super(message);
    this.name = "MailchimpNotConfiguredError";
  }
}

export class MailchimpDryRunSkip extends Error {
  constructor(message = "Skipped due to LEAD_PIPELINE_DRY_RUN=true") {
    super(message);
    this.name = "MailchimpDryRunSkip";
  }
}
