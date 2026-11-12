import { createAdminClient } from "@/lib/supabase/server"

export async function getUserCount(): Promise<number> {
  const supabase = await createAdminClient()
  const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true })
  if (error || count === null) throw new Error("Could not check initial setup status")
  return count
}
