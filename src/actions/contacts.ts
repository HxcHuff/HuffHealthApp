"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreateContactSchema, UpdateContactSchema } from "@/lib/validations/contact";
import { logActivity } from "./activities";

export async function createContact(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    company: formData.get("company") as string,
    jobTitle: formData.get("jobTitle") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    zipCode: formData.get("zipCode") as string,
    notes: formData.get("notes") as string,
  };

  const validated = CreateContactSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const contact = await db.contact.create({
    data: validated.data,
  });

  await logActivity({
    type: "NOTE",
    description: `Created contact: ${contact.firstName} ${contact.lastName}`,
    contactId: contact.id,
  });

  revalidatePath("/contacts");
  return { success: true, id: contact.id };
}

export async function updateContact(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateContactSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const contact = await db.contact.update({
    where: { id },
    data: validated.data,
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { success: true, contact };
}

export async function deleteContact(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  await db.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  return { success: true };
}

export async function getContacts({
  page = 1,
  limit = 25,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where,
      include: {
        lead: { select: { id: true, source: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.contact.count({ where }),
  ]);

  return { contacts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getContact(id: string) {
  return db.contact.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, source: true, status: true } },
      activities: {
        include: {
          performedBy: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}
