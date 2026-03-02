import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

// 더미 데이터 (Supabase 연동 전)
const featuredNewsletters = [
  {
    id: "1",
    title: "테크 인사이트",
    description: "매주 IT 업계의 핵심 뉴스와 트렌드를 깊이 있게 분석합니다.",
    writer: { name: "김개발", avatar_url: null },
    subscriber_count: 1240,
    is_paid: false,
  },
  {
    id: "2",
    title: "스타트업 레터",
    description: "한국 스타트업 생태계의 생생한 이야기를 전합니다.",
    writer: { name: "이창업", avatar_url: null },
    subscriber_count: 890,
    is_paid: true,
    price_monthly: 9900,
  },
  {
    id: "3",
    title: "디자인 위클리",
    description: "UX/UI 디자인의 최신 트렌드와 실무 팁을 공유합니다.",
    writer: { name: "박디자인", avatar_url: null },
    subscriber_count: 2100,
    is_paid: false,
  },
  {
    id: "4",
    title: "마케팅 브리프",
    description: "디지털 마케팅의 핵심 전략과 케이스 스터디를 매주 발행합니다.",
    writer: { name: "최마케팅", avatar_url: null },
    subscriber_count: 670,
    is_paid: true,
    price_monthly: 5900,
  },
];

const recentPosts = [
  {
    id: "1",
    title: "2026년 AI 트렌드 총정리: 에이전트의 시대가 열리다",
    excerpt: "올해 가장 주목받는 AI 기술 트렌드와 비즈니스 영향을 분석합니다.",
    newsletter: { title: "테크 인사이트" },
    writer: { name: "김개발" },
    published_at: "2026-03-01",
    is_premium: false,
  },
  {
    id: "2",
    title: "시리즈B 투자유치, 우리가 배운 것들",
    excerpt: "100억원 투자유치까지의 여정과 창업자가 알아야 할 교훈을 공유합니다.",
    newsletter: { title: "스타트업 레터" },
    writer: { name: "이창업" },
    published_at: "2026-02-28",
    is_premium: true,
  },
  {
    id: "3",
    title: "미니멀 디자인은 끝났다: 2026년 디자인 패러다임 변화",
    excerpt: "새로운 디자인 트렌드 '맥시멀 클래리티'의 등장과 적용 방법을 알아봅니다.",
    newsletter: { title: "디자인 위클리" },
    writer: { name: "박디자인" },
    published_at: "2026-02-27",
    is_premium: false,
  },
];

export default function HomePage() {
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
            <Link href="/explore">
              <Button size="lg">뉴스레터 탐색</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">작가로 시작하기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 인기 뉴스레터 */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">인기 뉴스레터</h2>
          <Link href="/explore" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            전체 보기 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredNewsletters.map((newsletter) => (
            <Link key={newsletter.id} href={`/newsletter/${newsletter.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={newsletter.writer.name} size="sm" />
                  <span className="text-sm text-gray-600">{newsletter.writer.name}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{newsletter.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{newsletter.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">구독자 {newsletter.subscriber_count.toLocaleString()}명</span>
                  {newsletter.is_paid && (
                    <Badge variant="info">월 {newsletter.price_monthly?.toLocaleString()}원</Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 최신 글 */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">최신 글</h2>

        <div className="space-y-4">
          {recentPosts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-primary-600 font-medium">{post.newsletter.title}</span>
                      <span className="text-xs text-gray-400">{post.writer.name}</span>
                      {post.is_premium && <Badge variant="warning">유료</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{post.published_at}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-primary-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">나만의 뉴스레터를 시작하세요</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            글을 쓰고, 구독자를 모으고, 수익을 창출하세요.
            누구나 무료로 시작할 수 있습니다.
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">무료로 시작하기</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
