import { auth } from "@/auth";
import { getTasks, getMyTasks } from "@/actions/tasks";
import { getStaffUsers } from "@/actions/leads";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TasksPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth();
  if (!session) return null;

  const tab = params.tab || "my";
  const showForm = params.new === "true";
  const staffUsers = await getStaffUsers();

  const isCompleted = tab === "completed" ? true : tab === "all" ? undefined : false;
  const assignedToId = tab === "my" ? session.user.id : undefined;

  const { tasks, total, page, totalPages } = await getTasks({
    assignedToId,
    isCompleted,
    page: Number(params.page) || 1,
  });

  const defaultLeadId = params.leadId;
  const defaultLeadName = params.leadName;
  const defaultTitle = params.title;

  const tabs = [
    { key: "my", label: "My Tasks" },
    { key: "all", label: "All Tasks" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${total} tasks`}
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/tasks?tab=${t.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <Link
          href="/tasks?new=true"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Add Task
        </Link>
      </div>

      {showForm && (
        <TaskForm
          staffUsers={staffUsers}
          defaultLeadId={defaultLeadId}
          defaultLeadName={defaultLeadName}
          defaultTitle={defaultTitle}
        />
      )}

      <TaskList
        tasks={JSON.parse(JSON.stringify(tasks))}
        total={total}
        page={page}
        totalPages={totalPages}
        showAssignee={tab !== "my"}
      />
    </div>
  );
}
