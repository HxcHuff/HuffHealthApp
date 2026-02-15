import Link from "next/link";
import { getContacts } from "@/actions/contacts";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import { Contact, Plus } from "lucide-react";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ContactsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search;

  const { contacts, total } = await getContacts({ page, search });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Contacts" description={`${total} contacts`} />
        <Link
          href="/contacts?new=true"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Link>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={<Contact className="h-6 w-6 text-gray-400" />}
          title="No contacts yet"
          description="Add a contact or convert a lead to create one."
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Zip Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Added</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {contact.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {contact.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {contact.zipCode || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {contact.lead?.source || "—"}
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
