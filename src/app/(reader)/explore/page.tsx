import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

interface NewsletterWithWriter {
  id: string;
  title: string;
  description: string | null;
  is_paid: boolean;
  price_monthly: number;
  writer: { name: string; avatar_url: string | null };
}

export default async function ExplorePage() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("newsletters")
    .select("id, title, description, is_paid, price_monthly, writer:profiles!writer_id(name, avatar_url)")
    .order("created_at", { ascending: false });

  const newsletters = (data ?? []) as unknown as NewsletterWithWriter[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">뉴스레터 탐색</h1>
        <p className="text-gray-500">관심 분야의 뉴스레터를 찾아보세요</p>
      </div>

      {newsletters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsletters.map((nl) => (
            <Link key={nl.id} href={`/newsletter/${nl.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={nl.writer?.name ?? ""} src={nl.writer?.avatar_url} size="md" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{nl.writer?.name}</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{nl.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{nl.description}</p>
                {nl.is_paid && (
                  <Badge variant="info">월 {nl.price_monthly.toLocaleString()}원</Badge>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-400 mb-2">아직 등록된 뉴스레터가 없습니다</p>
          <p className="text-sm text-gray-400">첫 번째 작가가 되어보세요!</p>
        </Card>
      )}
    </div>
  );
}
