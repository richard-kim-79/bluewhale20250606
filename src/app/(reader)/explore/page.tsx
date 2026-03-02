import Link from "next/link";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

// 더미 데이터
const newsletters = [
  { id: "1", title: "테크 인사이트", description: "매주 IT 업계의 핵심 뉴스와 트렌드를 깊이 있게 분석합니다.", writer: { name: "김개발" }, subscriber_count: 1240, is_paid: false, category: "기술" },
  { id: "2", title: "스타트업 레터", description: "한국 스타트업 생태계의 생생한 이야기를 전합니다.", writer: { name: "이창업" }, subscriber_count: 890, is_paid: true, price_monthly: 9900, category: "비즈니스" },
  { id: "3", title: "디자인 위클리", description: "UX/UI 디자인의 최신 트렌드와 실무 팁을 공유합니다.", writer: { name: "박디자인" }, subscriber_count: 2100, is_paid: false, category: "디자인" },
  { id: "4", title: "마케팅 브리프", description: "디지털 마케팅의 핵심 전략과 케이스 스터디를 발행합니다.", writer: { name: "최마케팅" }, subscriber_count: 670, is_paid: true, price_monthly: 5900, category: "마케팅" },
  { id: "5", title: "경제 브리핑", description: "매일 아침 5분, 한국 경제의 핵심 이슈를 정리합니다.", writer: { name: "정경제" }, subscriber_count: 3400, is_paid: false, category: "경제" },
  { id: "6", title: "코딩 챌린지", description: "매주 새로운 알고리즘 문제와 풀이를 공유하는 뉴스레터입니다.", writer: { name: "강코딩" }, subscriber_count: 560, is_paid: false, category: "기술" },
];

const categories = ["전체", "기술", "비즈니스", "디자인", "마케팅", "경제", "라이프스타일"];

export default function ExplorePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">뉴스레터 탐색</h1>
        <p className="text-gray-500">관심 분야의 뉴스레터를 찾아보세요</p>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <Input placeholder="뉴스레터 또는 작가 검색..." />
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              cat === "전체"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 뉴스레터 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {newsletters.map((nl) => (
          <Link key={nl.id} href={`/newsletter/${nl.id}`}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={nl.writer.name} size="md" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{nl.writer.name}</p>
                  <p className="text-xs text-gray-400">구독자 {nl.subscriber_count.toLocaleString()}명</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{nl.title}</h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{nl.description}</p>
              <div className="flex items-center gap-2">
                <Badge>{nl.category}</Badge>
                {nl.is_paid && <Badge variant="info">월 {nl.price_monthly?.toLocaleString()}원</Badge>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
