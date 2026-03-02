import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface PostDetail {
  id: string; title: string; content: string; excerpt: string | null;
  is_premium: boolean; is_published: boolean; published_at: string | null;
  writer_id: string; newsletter_id: string;
  newsletter: { id: string; title: string; is_paid: boolean };
  writer: { name: string; avatar_url: string | null };
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { data: postData } = await supabase
    .from("posts")
    .select("*, newsletter:newsletters!newsletter_id(id, title, is_paid), writer:profiles!writer_id(name, avatar_url)")
    .eq("id", id)
    .single();

  const post = postData as unknown as PostDetail | null;
  if (!post || !post.is_published) notFound();

  // 유료 글 접근 제어
  let canRead = true;
  if (post.is_premium) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      canRead = false;
    } else if (user.id !== post.writer_id) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("subscriber_id", user.id)
        .eq("newsletter_id", post.newsletter_id)
        .eq("status", "active")
        .eq("is_paid", true)
        .single();
      canRead = !!sub;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/newsletter/${post.newsletter.id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          {post.newsletter.title}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{post.title}</h1>
        <div className="flex items-center gap-3">
          <Avatar name={post.writer.name} src={post.writer.avatar_url} size="sm" />
          <div>
            <p className="text-sm font-medium text-gray-900">{post.writer.name}</p>
            <p className="text-xs text-gray-400">
              {post.published_at && new Date(post.published_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
          {post.is_premium && <Badge variant="warning">유료</Badge>}
        </div>
      </div>

      {canRead ? (
        <article className="prose prose-gray max-w-none">
          {post.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-4">{line.slice(3)}</h2>;
            if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold text-gray-900 mt-6 mb-3">{line.slice(4)}</h3>;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="text-gray-700 leading-relaxed mb-4">{line}</p>;
          })}
        </article>
      ) : (
        <Card className="text-center py-12">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">유료 구독자 전용 콘텐츠입니다</h3>
          <p className="text-sm text-gray-500 mb-4">이 글을 읽으려면 유료 구독이 필요합니다</p>
          <Link href={`/newsletter/${post.newsletter.id}`}>
            <Button>구독하러 가기</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
