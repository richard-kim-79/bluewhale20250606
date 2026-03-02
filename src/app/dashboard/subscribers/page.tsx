import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import SubscribersListClient from "./SubscribersListClient";

interface SubWithProfile {
  id: string; is_paid: boolean; status: string; created_at: string;
  subscriber: { name: string; email: string } | null;
}

export default async function SubscribersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: newsletters } = await supabase
    .from("newsletters")
    .select("id")
    .eq("writer_id", user.id);

  const newsletterIds = newsletters?.map((n) => n.id) ?? [];

  const { data: subscriptionsData } = await supabase
    .from("subscriptions")
    .select("id, is_paid, status, created_at, subscriber:profiles!subscriber_id(name, email)")
    .in("newsletter_id", newsletterIds.length > 0 ? newsletterIds : ["__none__"])
    .order("created_at", { ascending: false });

  const subscriptions = (subscriptionsData ?? []) as unknown as SubWithProfile[];

  const subs = subscriptions.map((s) => ({
    id: s.id,
    name: s.subscriber?.name ?? "알 수 없음",
    email: s.subscriber?.email ?? "",
    is_paid: s.is_paid,
    status: s.status,
    subscribed_at: s.created_at,
  }));

  return <SubscribersListClient subscribers={subs} />;
}
