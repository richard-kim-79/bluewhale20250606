import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 내 뉴스레터 가져오기
  const { data: newsletters } = await supabase
    .from("newsletters")
    .select("id")
    .eq("writer_id", user.id);

  const newsletterIds = newsletters?.map((n) => n.id) ?? [];

  // 통계 데이터
  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .in("newsletter_id", newsletterIds.length > 0 ? newsletterIds : ["__none__"])
    .eq("status", "active");

  const { count: paidSubscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .in("newsletter_id", newsletterIds.length > 0 ? newsletterIds : ["__none__"])
    .eq("status", "active")
    .eq("is_paid", true);

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, is_published, published_at, created_at")
    .eq("writer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentSubsData } = await supabase
    .from("subscriptions")
    .select("id, is_paid, created_at, subscriber:profiles!subscriber_id(name, email)")
    .in("newsletter_id", newsletterIds.length > 0 ? newsletterIds : ["__none__"])
    .order("created_at", { ascending: false })
    .limit(5);

  const recentSubs = (recentSubsData ?? []) as unknown as {
    id: string; is_paid: boolean; created_at: string;
    subscriber: { name: string; email: string } | null;
  }[];

  const stats = [
    { label: "총 구독자", value: (subscriberCount ?? 0).toLocaleString() + "명" },
    { label: "유료 구독자", value: (paidSubscriberCount ?? 0).toLocaleString() + "명" },
    { label: "총 발행 글", value: (posts?.filter((p) => p.is_published).length ?? 0).toString() + "개" },
    { label: "초안", value: (posts?.filter((p) => !p.is_published).length ?? 0).toString() + "개" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">뉴스레터 성과를 한눈에 확인하세요</p>
      </div>

      {newsletterIds.length === 0 && (
        <Card className="mb-8 border-primary-200 bg-primary-50">
          <div className="text-center py-4">
            <p className="text-primary-800 font-medium mb-2">아직 뉴스레터가 없습니다</p>
            <p className="text-sm text-primary-600 mb-4">설정 페이지에서 뉴스레터를 만들어보세요</p>
            <Link href="/dashboard/settings" className="text-sm text-primary-700 underline font-medium">
              뉴스레터 만들기 &rarr;
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 글</h2>
            <Link href="/dashboard/posts" className="text-sm text-primary-600 hover:text-primary-700">전체 보기</Link>
          </div>
          {posts && posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/posts/${post.id}/edit`} className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">
                      {post.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString("ko-KR") : "초안"}
                    </p>
                  </div>
                  <Badge variant={post.is_published ? "success" : "default"}>
                    {post.is_published ? "발행됨" : "초안"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">아직 작성한 글이 없습니다</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 구독자</h2>
            <Link href="/dashboard/subscribers" className="text-sm text-primary-600 hover:text-primary-700">전체 보기</Link>
          </div>
          {recentSubs && recentSubs.length > 0 ? (
            <div className="space-y-3">
              {recentSubs.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{sub.subscriber?.name ?? "알 수 없음"}</p>
                      <p className="text-xs text-gray-400">{sub.subscriber?.email ?? ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sub.is_paid ? "info" : "default"}>{sub.is_paid ? "유료" : "무료"}</Badge>
                      <span className="text-xs text-gray-400">{new Date(sub.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">아직 구독자가 없습니다</p>
          )}
        </Card>
      </div>
    </div>
  );
}
