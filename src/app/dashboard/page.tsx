import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

// 더미 통계 데이터
const stats = [
  { label: "총 구독자", value: "1,240", change: "+12%", trend: "up" },
  { label: "유료 구독자", value: "89", change: "+5%", trend: "up" },
  { label: "이번 달 수익", value: "881,100원", change: "+8%", trend: "up" },
  { label: "총 발행 글", value: "47", change: "+2", trend: "up" },
];

const recentPosts = [
  { id: "1", title: "2026년 AI 트렌드 총정리", status: "published", views: 342, published_at: "2026-03-01" },
  { id: "2", title: "GPT-5가 바꿀 개발자의 미래", status: "published", views: 289, published_at: "2026-02-25" },
  { id: "3", title: "클라우드 네이티브 아키텍처 입문", status: "draft", views: 0, published_at: null },
];

const recentSubscribers = [
  { name: "홍길동", email: "hong@example.com", is_paid: true, subscribed_at: "2026-03-01" },
  { name: "김철수", email: "kim@example.com", is_paid: false, subscribed_at: "2026-02-28" },
  { name: "이영희", email: "lee@example.com", is_paid: true, subscribed_at: "2026-02-27" },
  { name: "박민수", email: "park@example.com", is_paid: false, subscribed_at: "2026-02-26" },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">뉴스레터 성과를 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-green-600 mt-1">
              <span className="inline-flex items-center">
                <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                {stat.change} 지난 달 대비
              </span>
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 글 */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 글</h2>
            <Link href="/dashboard/posts" className="text-sm text-primary-600 hover:text-primary-700">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/posts/${post.id}/edit`} className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">
                    {post.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {post.published_at || "초안"} {post.views > 0 && `· 조회 ${post.views}`}
                  </p>
                </div>
                <Badge variant={post.status === "published" ? "success" : "default"}>
                  {post.status === "published" ? "발행됨" : "초안"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* 최근 구독자 */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 구독자</h2>
            <Link href="/dashboard/subscribers" className="text-sm text-primary-600 hover:text-primary-700">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {recentSubscribers.map((sub) => (
              <div key={sub.email} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                  <p className="text-xs text-gray-400">{sub.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sub.is_paid ? "info" : "default"}>
                    {sub.is_paid ? "유료" : "무료"}
                  </Badge>
                  <span className="text-xs text-gray-400">{sub.subscribed_at}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
