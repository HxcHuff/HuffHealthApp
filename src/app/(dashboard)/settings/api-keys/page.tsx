import { redirect } from "next/navigation";

export default async function ApiKeysPage() {
  redirect("/integrations");
}
