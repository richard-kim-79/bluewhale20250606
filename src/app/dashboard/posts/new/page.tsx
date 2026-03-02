"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveDraft = async () => {
    setSaving(true);
    // TODO: Supabase에 저장
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    alert("초안이 저장되었습니다.");
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("본문을 입력해주세요.");
      return;
    }
    setSaving(true);
    // TODO: Supabase에 저장 + is_published = true
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    alert("글이 발행되었습니다!");
    router.push("/dashboard/posts");
  };

  return (
    <div>
      {/* 상단 바 */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          돌아가기
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving}>
            초안 저장
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={saving}>
            {saving ? "저장 중..." : "발행하기"}
          </Button>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="max-w-3xl mx-auto space-y-6">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl font-bold text-gray-900 placeholder:text-gray-300 border-0 outline-none focus:ring-0 bg-transparent"
        />

        <Input
          placeholder="미리보기 문구 (선택)"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />

        {/* 유료 전용 토글 */}
        <div className="flex items-center gap-3 py-3 border-y border-gray-200">
          <button
            onClick={() => setIsPremium(!isPremium)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isPremium ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                isPremium ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">유료 구독자 전용</span>
        </div>

        {/* 텍스트 에디터 (간단한 textarea — 추후 리치 에디터로 교체 가능) */}
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-4">
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" /><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Italic">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m-2 0v16m-4 0h8" />
              </svg>
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Heading">
              <span className="text-xs font-bold">H</span>
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="List">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Image">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
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
    </div>
  );
}
