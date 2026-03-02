import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

interface NLWithWriter {
  id: string; title: string; description: string | null; is_paid: boolean; price_monthly: number;
  writer: { name: string; avatar_url: string | null };
}
interface PostWithJoin {
  id: string; title: string; excerpt: string | null; is_premium: boolean; published_at: string | null;
  newsletter: { title: string }; writer: { name: string };
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const { data: nlData } = await supabase
    .from("newsletters")
    .select("id, title, description, is_paid, price_monthly, writer:profiles!writer_id(name, avatar_url)")
    .limit(4);
  const newsletters = (nlData ?? []) as unknown as NLWithWriter[];

  const { data: postData } = await supabase
    .from("posts")
    .select("id, title, excerpt, is_premium, published_at, newsletter:newsletters!newsletter_id(title), writer:profiles!writer_id(name)")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(5);
  const posts = (postData ?? []) as unknown as PostWithJoin[];

  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            좋아하는 작가의 글을
            <br />
            <span className="text-primary-600">뉴스레터</span>로 만나세요
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            다양한 분야의 전문 작가들이 매주 발행하는 깊이 있는 콘텐츠를 구독하고,
            나만의 뉴스레터를 시작하세요.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/explore"><Button size="lg">뉴스레터 탐색</Button></Link>
            <Link href="/register"><Button variant="outline" size="lg">작가로 시작하기</Button></Link>
          </div>
        </div>
      </section>

      {/* 인기 뉴스레터 */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">뉴스레터</h2>
          <Link href="/explore" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            전체 보기 &rarr;
          </Link>
        </div>

        {newsletters && newsletters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {newsletters.map((nl) => (
                <Link key={nl.id} href={`/newsletter/${nl.id}`}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={nl.writer?.name ?? ""} src={nl.writer?.avatar_url} size="sm" />
                      <span className="text-sm text-gray-600">{nl.writer?.name}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{nl.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{nl.description}</p>
                    {nl.is_paid && (
                      <Badge variant="info">월 {nl.price_monthly.toLocaleString()}원</Badge>
                    )}
                  </Card>
                </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <p className="text-gray-400">아직 등록된 뉴스레터가 없습니다</p>
          </Card>
        )}
      </section>

      {/* 최신 글 */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">최신 글</h2>

        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-primary-600 font-medium">{post.newsletter?.title}</span>
                          <span className="text-xs text-gray-400">{post.writer?.name}</span>
                          {post.is_premium && <Badge variant="warning">유료</Badge>}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h3>
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
          <Card className="text-center py-8">
            <p className="text-gray-400">아직 발행된 글이 없습니다</p>
          </Card>
        )}
      </section>

      {/* CTA 섹션 */}
      <section className="bg-primary-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">나만의 뉴스레터를 시작하세요</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            글을 쓰고, 구독자를 모으고, 수익을 창출하세요.
            누구나 무료로 시작할 수 있습니다.
          </p>
          <Link href="/register"><Button variant="secondary" size="lg">무료로 시작하기</Button></Link>
        </div>
      </section>
    </div>
  );
}
