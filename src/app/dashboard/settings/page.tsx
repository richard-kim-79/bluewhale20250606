"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newsletterId, setNewsletterId] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState({
    title: "",
    description: "",
    is_paid: false,
    price_monthly: 0,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("newsletters")
        .select("id, title, description, is_paid, price_monthly")
        .eq("writer_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setNewsletterId(data.id);
        setNewsletter({
          title: data.title,
          description: data.description ?? "",
          is_paid: data.is_paid,
          price_monthly: data.price_monthly,
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (newsletterId) {
      await supabase.from("newsletters").update({
        title: newsletter.title,
        description: newsletter.description,
        is_paid: newsletter.is_paid,
        price_monthly: newsletter.price_monthly,
      }).eq("id", newsletterId);
    } else {
      const { data } = await supabase.from("newsletters").insert({
        writer_id: user.id,
        title: newsletter.title || `${user.email}의 뉴스레터`,
        description: newsletter.description,
        is_paid: newsletter.is_paid,
        price_monthly: newsletter.price_monthly,
      }).select("id").single();
      if (data) setNewsletterId(data.id);
    }

    setSaving(false);
    router.refresh();
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">로딩 중...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">뉴스레터 설정</h1>
        <p className="text-sm text-gray-500 mt-1">뉴스레터 정보와 결제 설정을 관리합니다</p>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
          <div className="space-y-4">
            <Input
              label="뉴스레터 이름"
              value={newsletter.title}
              onChange={(e) => setNewsletter({ ...newsletter, title: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                rows={3}
                value={newsletter.description}
                onChange={(e) => setNewsletter({ ...newsletter, description: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">유료 구독 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">유료 구독 활성화</p>
                <p className="text-xs text-gray-500">유료 전용 콘텐츠를 제공하고 수익을 창출합니다</p>
              </div>
              <button
                onClick={() => setNewsletter({ ...newsletter, is_paid: !newsletter.is_paid })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  newsletter.is_paid ? "bg-primary-600" : "bg-gray-200"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  newsletter.is_paid ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
            {newsletter.is_paid && (
              <Input
                label="월 구독료 (원)"
                type="number"
                value={newsletter.price_monthly.toString()}
                onChange={(e) => setNewsletter({ ...newsletter, price_monthly: parseInt(e.target.value) || 0 })}
              />
            )}
          </div>
        </Card>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "변경 사항 저장"}
        </Button>
      </div>
    </div>
  );
}
