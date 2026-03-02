import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import PostsListClient from "./PostsListClient";

export default async function PostsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, is_published, is_premium, published_at, created_at")
    .eq("writer_id", user.id)
    .order("created_at", { ascending: false });

  return <PostsListClient posts={posts ?? []} />;
}
