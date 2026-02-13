import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import { Contact } from "lucide-react";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ContactsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search;

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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
    }),
    db.contact.count({ where }),
  ]);

  return (
    <>
      <PageHeader title="Contacts" description={`${total} contacts`} />

      {contacts.length === 0 ? (
        <EmptyState
          icon={<Contact className="h-6 w-6 text-gray-400" />}
          title="No contacts yet"
          description="Contacts are created when leads are converted."
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Added</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {contact.firstName} {contact.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {contact.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {contact.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {contact.company || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {formatRelativeTime(contact.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
