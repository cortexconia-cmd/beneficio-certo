import { supabase } from "@/integrations/supabase/client";

let lastUser = "";
let lastRun = 0;
let inflight: Promise<boolean> | null = null;

// Asks the server to reconcile this user's checkouts with Asaas. Resolves true when access was just granted.
export function syncAsaasAccess(userId: string, force = false): Promise<boolean> {
  if (inflight) return inflight;
  if (!force && userId === lastUser && Date.now() - lastRun < 10_000) return Promise.resolve(false);
  lastUser = userId;
  lastRun = Date.now();
  inflight = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("asaas-sync-access", { body: {} });
      return !error && Number(data?.activated ?? 0) > 0;
    } catch { return false; }
    finally { inflight = null; }
  })();
  return inflight;
}
