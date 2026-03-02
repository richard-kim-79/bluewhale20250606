import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SubscribeButton from "./SubscribeButton";

interface NLDetail {
  id: string; title: string; description: string | null; is_paid: boolean; price_monthly: number;
  writer: { id: string; name: string; bio: string | null; avatar_url: string | null };
}

export default async function NewsletterPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { data: nlData } = await supabase
    .from("newsletters")
    .select("*, writer:profiles!writer_id(id, name, bio, avatar_url)")
    .eq("id", id)
    .single();

  if (!nlData) notFound();
  const newsletter = nlData as unknown as NLDetail;

  const { count: subscriberCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("newsletter_id", id)
    .eq("status", "active");

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, excerpt, is_premium, published_at")
    .eq("newsletter_id", id)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(20);

  const { data: { user } } = await supabase.auth.getUser();
  let isSubscribed = false;
  if (user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("subscriber_id", user.id)
      .eq("newsletter_id", id)
      .eq("status", "active")
      .single();
    isSubscribed = !!sub;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <Avatar name={newsletter.writer.name} src={newsletter.writer.avatar_url} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{newsletter.title}</h1>
            <p className="text-sm text-gray-600 mt-1">by {newsletter.writer.name}</p>
            {newsletter.writer.bio && <p className="text-sm text-gray-500 mt-2">{newsletter.writer.bio}</p>}
          </div>
        </div>

        {newsletter.description && (
          <p className="text-gray-600 mb-4">{newsletter.description}</p>
        )}

        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-gray-500">구독자 {(subscriberCount ?? 0).toLocaleString()}명</span>
          {newsletter.is_paid && (
            <Badge variant="info">월 {newsletter.price_monthly.toLocaleString()}원</Badge>
          )}
        </div>

        {user ? (
          isSubscribed ? (
            <Badge variant="success">구독 중</Badge>
          ) : (
            <SubscribeButton newsletterId={id} isPaid={newsletter.is_paid} price={newsletter.price_monthly} />
          )
        ) : (
          <Link href="/login">
            <Button>로그인하고 구독하기</Button>
          </Link>
        )}
      </div>

      {/* 글 목록 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">발행된 글</h2>
        {posts && posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{post.title}</h3>
                        {post.is_premium && <Badge variant="warning">유료</Badge>}
                      </div>
                      {post.excerpt && <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString("ko-KR") : ""}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">아직 발행된 글이 없습니다</p>
        )}
      </div>
    </div>
  );
}
