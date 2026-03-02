"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newsletterId, setNewsletterId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("newsletters")
        .select("id")
        .eq("writer_id", user.id)
        .limit(1)
        .single();
      if (data) setNewsletterId(data.id);
    }
    load();
  }, [supabase, router]);

  const savePost = async (publish: boolean) => {
    if (!title.trim()) { alert("제목을 입력해주세요."); return; }
    if (publish && !content.trim()) { alert("본문을 입력해주세요."); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newsletterId) { setSaving(false); return; }

    const { error } = await supabase.from("posts").insert({
      newsletter_id: newsletterId,
      writer_id: user.id,
      title,
      content,
      excerpt: excerpt || null,
      is_premium: isPremium,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    });

    setSaving(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    router.push("/dashboard/posts");
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          돌아가기
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => savePost(false)} disabled={saving}>초안 저장</Button>
          <Button size="sm" onClick={() => savePost(true)} disabled={saving}>
            {saving ? "저장 중..." : "발행하기"}
          </Button>
        </div>
      </div>

      {!newsletterId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
          뉴스레터를 먼저 만들어야 글을 작성할 수 있습니다.{" "}
          <button onClick={() => router.push("/dashboard/settings")} className="underline font-medium">설정으로 이동</button>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl font-bold text-gray-900 placeholder:text-gray-300 border-0 outline-none focus:ring-0 bg-transparent"
        />
        <Input placeholder="미리보기 문구 (선택)" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />

        <div className="flex items-center gap-3 py-3 border-y border-gray-200">
          <button
            onClick={() => setIsPremium(!isPremium)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPremium ? "bg-primary-600" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isPremium ? "translate-x-5" : "translate-x-1"}`} />
          </button>
          <span className="text-sm text-gray-600">유료 구독자 전용</span>
        </div>

        <textarea
          placeholder="여기에 글을 작성하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full text-base text-gray-800 placeholder:text-gray-300 border-0 outline-none focus:ring-0 bg-transparent resize-none leading-relaxed"
        />
      </div>
    </div>
  );
}
