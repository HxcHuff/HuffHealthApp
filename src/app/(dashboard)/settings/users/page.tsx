import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { UserManagement } from "@/components/admin/user-management";

export default async function UserManagementPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          assignedLeads: true,
          assignedTickets: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="User Management" description="Manage team members and client accounts" />
      <UserManagement users={JSON.parse(JSON.stringify(users))} />
    </>
  );
}
