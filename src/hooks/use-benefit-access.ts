import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const FREE_BENEFIT_SLUGS = new Set(["bolsa-familia", "auxilio-gas", "bpc"]);
export function isFreeBenefit(slug: string): boolean { return FREE_BENEFIT_SLUGS.has(slug) || slug === "bpc-loas"; }

export function useBenefitAccess() {
  const { user, phoneVerified, loading: authLoading } = useAuth();
  const access = useQuery({
    queryKey: ["benefit-access", user?.id],
    enabled: !!user?.id && !authLoading,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.from("access_grants")
        .select("access_scope,benefit_id,starts_at,expires_at,revoked_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      const now = Date.now();
      return data.filter(g => !g.revoked_at && Date.parse(g.starts_at) <= now && (!g.expires_at || Date.parse(g.expires_at) > now));
    },
  });
  const staffRole = useQuery({
    queryKey: ["benefit-staff-role", user?.id],
    enabled: !!user?.id && !authLoading,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles")
        .select("role").eq("user_id", user!.id).in("role", ["admin", "admin_master"]);
      if (error) throw error;
      return !!data?.length;
    },
  });
  // Admin and AdminMaster have premium rights from their roles, not fake payment records.
  const isStaff = !!user && staffRole.data === true && !staffRole.isError;
  const hasCatalog = isStaff || (!!user && phoneVerified && !!access.data?.some(g => g.access_scope === "catalog"));
  return {
    user, phoneVerified, hasCatalog, isStaff,
    checking: authLoading || (!!user && (access.isPending || access.isFetching || staffRole.isPending || staffRole.isFetching)),
    error: access.error,
    canOpen: (slug: string, benefitId?: string) =>
      isFreeBenefit(slug) || (hasCatalog && !access.isError) ||
      (!!user && phoneVerified && !!benefitId && !!access.data?.some(g => g.access_scope === "benefit" && g.benefit_id === benefitId)),
    refresh: async () => { await Promise.all([access.refetch(), staffRole.refetch()]); },
  };
}
