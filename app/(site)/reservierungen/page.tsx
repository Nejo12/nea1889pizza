import { redirect } from "next/navigation";

// Legacy URL of the pre-migration booking form.
export default function Page() {
  redirect("/reservierung");
}
