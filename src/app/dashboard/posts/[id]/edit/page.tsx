"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// 더미 데이터 (실제로는 params.id로 Supabase에서 조회)
const mockPost = {
  id: "1",
  title: "2026년 AI 트렌드 총정리: 에이전트의 시대가 열리다",
  content: "인공지능 기술이 빠르게 발전하면서, 2026년은 'AI 에이전트'의 시대로 불리고 있습니다.\n\n올해 주목할 핵심 트렌드를 정리해 보겠습니다.\n\n## 1. 자율형 AI 에이전트\n\nAI가 단순한 도구를 넘어, 스스로 판단하고 행동하는 에이전트로 진화하고 있습니다.\n\n## 2. 멀티모달 AI의 대중화\n\n텍스트, 이미지, 음성, 영상을 동시에 이해하고 생성하는 AI가 보편화되었습니다.\n\n## 3. AI-네이티브 앱의 등장\n\nAI를 핵심 기반으로 설계된 새로운 유형의 애플리케이션이 등장하고 있습니다.",
  excerpt: "올해 가장 주목받는 AI 기술 트렌드와 비즈니스 영향을 분석합니다.",
  is_premium: false,
  is_published: true,
};

export default function EditPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState(mockPost.title);
  const [content, setContent] = useState(mockPost.content);
  const [excerpt, setExcerpt] = useState(mockPost.excerpt);
  const [isPremium, setIsPremium] = useState(mockPost.is_premium);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Supabase 업데이트
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    alert("저장되었습니다.");
  };

  const handleDelete = () => {
    if (confirm("정말 이 글을 삭제하시겠습니까?")) {
      // TODO: Supabase에서 삭제
      router.push("/dashboard/posts");
    }
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
          <Button variant="danger" size="sm" onClick={handleDelete}>삭제</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장하기"}
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
