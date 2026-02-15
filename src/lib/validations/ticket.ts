import { z } from "zod";

export const CreateTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedToId: z.string().optional(),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  dueDate: z.string().optional(),
});

export const UpdateTicketSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const CreateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  isInternal: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
