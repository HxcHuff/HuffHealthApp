import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: "admin@huffhealth.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@huffhealth.com",
      hashedPassword,
      role: "ADMIN",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@huffhealth.com" },
    update: {},
    create: {
      name: "Staff Member",
      email: "staff@huffhealth.com",
      hashedPassword,
      role: "STAFF",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      name: "Jane Client",
      email: "client@example.com",
      hashedPassword,
      role: "CLIENT",
    },
  });

  // Create lead sources
  const sourceNames = [
    "Facebook Lead Ad",
    "Website",
    "Referral",
    "Cold Call",
    "Email Campaign",
    "CSV Import",
    "Manual Entry",
    "Other",
  ];
  for (const name of sourceNames) {
    await prisma.leadSource.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Lead sources seeded.");

  // Create sample leads
  const leadData = [
    { firstName: "John", lastName: "Smith", email: "john@example.com", phone: "555-0101", company: "Acme Corp", source: "Facebook Lead Ad", status: "NEW_LEAD" as const },
    { firstName: "Sarah", lastName: "Johnson", email: "sarah@example.com", phone: "555-0102", company: "TechStart Inc", source: "Website", status: "CONTACTED" as const },
    { firstName: "Mike", lastName: "Williams", email: "mike@example.com", phone: "555-0103", company: "Health Plus", source: "Referral", status: "QUOTED" as const },
    { firstName: "Emily", lastName: "Brown", email: "emily@example.com", phone: "555-0104", company: "Wellness Co", source: "Facebook Lead Ad", status: "NEW_LEAD" as const },
    { firstName: "David", lastName: "Jones", email: "david@example.com", phone: "555-0105", company: "FitLife LLC", source: "CSV Import", status: "CONTACTED" as const },
    { firstName: "Lisa", lastName: "Davis", email: "lisa@example.com", phone: "555-0106", company: "Care Solutions", source: "Cold Call", status: "ENROLLED" as const },
    { firstName: "Robert", lastName: "Miller", email: "robert@example.com", phone: "555-0107", company: "MedTech", source: "Email Campaign", status: "LOST" as const },
    { firstName: "Jennifer", lastName: "Wilson", email: "jennifer@example.com", phone: "555-0108", company: "HealthFirst", source: "Facebook Lead Ad", status: "APPLICATION_SENT" as const },
    { firstName: "Chris", lastName: "Moore", email: "chris@example.com", phone: "555-0109", company: "Vitality Inc", source: "Website", status: "QUOTED" as const },
    { firstName: "Amanda", lastName: "Taylor", email: "amanda@example.com", phone: "555-0110", company: "WellBeing Co", source: "Referral", status: "CONTACTED" as const },
  ];

  const leads = [];
  for (const data of leadData) {
    const lead = await prisma.lead.create({
      data: {
        ...data,
        createdById: admin.id,
        assignedToId: Math.random() > 0.5 ? staff.id : admin.id,
      },
    });
    leads.push(lead);
  }

  // Create sample tickets
  const ticketData = [
    { subject: "Cannot access my account", description: "I've been locked out of my account after multiple failed login attempts. Need help resetting.", priority: "HIGH" as const, status: "OPEN" as const },
    { subject: "Billing question", description: "I was charged twice for last month's service. Please investigate.", priority: "MEDIUM" as const, status: "IN_PROGRESS" as const },
    { subject: "Feature request: Dark mode", description: "Would love to have a dark mode option for the portal. It would be easier on the eyes.", priority: "LOW" as const, status: "OPEN" as const },
    { subject: "Data export not working", description: "When I try to export my data to CSV, the download fails with an error. Browser: Chrome 120.", priority: "URGENT" as const, status: "OPEN" as const },
  ];

  const tickets = [];
  for (const data of ticketData) {
    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        createdById: client.id,
        clientId: client.id,
        assignedToId: staff.id,
      },
    });
    tickets.push(ticket);
  }

  // Add some comments
  await prisma.ticketComment.create({
    data: {
      content: "I've reset your account. Please try logging in again with a new password.",
      ticketId: tickets[0].id,
      authorId: staff.id,
      isInternal: false,
    },
  });

  await prisma.ticketComment.create({
    data: {
      content: "Internal note: Customer has had this issue before. Consider implementing 2FA.",
      ticketId: tickets[0].id,
      authorId: staff.id,
      isInternal: true,
    },
  });

  await prisma.ticketComment.create({
    data: {
      content: "Thank you! That worked.",
      ticketId: tickets[0].id,
      authorId: client.id,
      isInternal: false,
    },
  });

  // Create an announcement
  await prisma.announcement.create({
    data: {
      title: "Welcome to HuffHealth Portal",
      content: "We're excited to launch our new client portal! Here you can submit support tickets, track their progress, and stay up to date with the latest announcements from our team. If you have any questions, don't hesitate to create a ticket.",
      isPublished: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  // Create some activities
  await prisma.activity.create({
    data: {
      type: "NOTE",
      description: "System initialized with seed data",
      performedById: admin.id,
    },
  });

  for (const lead of leads.slice(0, 5)) {
    await prisma.activity.create({
      data: {
        type: "NOTE",
        description: `Lead ${lead.firstName} ${lead.lastName} was added`,
        performedById: admin.id,
        leadId: lead.id,
      },
    });
  }

  console.log("Seed complete!");
  console.log("\nTest Accounts:");
  console.log("  Admin: admin@huffhealth.com / password123");
  console.log("  Staff: staff@huffhealth.com / password123");
  console.log("  Client: client@example.com / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
