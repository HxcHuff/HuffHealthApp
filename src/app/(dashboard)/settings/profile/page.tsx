import { redirect } from "next/navigation";
import { getProfile } from "@/actions/settings";
import { ProfileForm } from "@/components/settings/profile-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function ProfilePage() {
  const user = await getProfile();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader title="Edit Profile" />
      <ProfileForm user={JSON.parse(JSON.stringify(user))} />
    </>
  );
}
