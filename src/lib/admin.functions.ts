import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Bootstraps admin role: if no admin exists, the caller becomes admin.
// Returns whether the caller is (now) an admin.
export const claimAdminIfNone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existingAdmins, error: listErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    if (listErr) throw listErr;

    if (existingAdmins && existingAdmins.length > 0) {
      const { data: mine, error: mineErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .eq("user_id", context.userId)
        .maybeSingle();
      if (mineErr) throw mineErr;
      return { isAdmin: Boolean(mine) };
    }

    const { error: insertErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertErr && insertErr.code !== "23505") throw insertErr;

    return { isAdmin: true };
  });
