"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: post } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (post) {
        setTitle(post.title);
        setContent(post.content);
        setExcerpt(post.excerpt ?? "");
        setIsPremium(post.is_premium);
        setIsPublished(post.is_published);
      }
      setLoading(false);
    }
    load();
  }, [supabase, postId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("posts").update({
      title,
      content,
      excerpt: excerpt || null,
      is_premium: isPremium,
    }).eq("id", postId);

    setSaving(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    router.refresh();
  };

  const handlePublish = async () => {
    setSaving(true);
    await supabase.from("posts").update({
      title,
      content,
      excerpt: excerpt || null,
      is_premium: isPremium,
      is_published: true,
      published_at: new Date().toISOString(),
    }).eq("id", postId);
    setSaving(false);
    router.push("/dashboard/posts");
    router.refresh();
  };

  const handleUnpublish = async () => {
    await supabase.from("posts").update({
      is_published: false,
      published_at: null,
    }).eq("id", postId);
    setIsPublished(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    router.push("/dashboard/posts");
    router.refresh();
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">로딩 중...</div>;
  }

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
          <Button variant="danger" size="sm" onClick={handleDelete}>삭제</Button>
          {isPublished ? (
            <>
              <Button variant="outline" size="sm" onClick={handleUnpublish}>비공개로 전환</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "저장하기"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>초안 저장</Button>
              <Button size="sm" onClick={handlePublish} disabled={saving}>
                {saving ? "저장 중..." : "발행하기"}
              </Button>
            </>
          )}
        </div>
      </div>

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
