"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// 더미 데이터
const allPosts = [
  { id: "1", title: "2026년 AI 트렌드 총정리: 에이전트의 시대가 열리다", status: "published", is_premium: false, views: 342, published_at: "2026-03-01", created_at: "2026-02-28" },
  { id: "2", title: "GPT-5가 바꿀 개발자의 미래", status: "published", is_premium: true, views: 289, published_at: "2026-02-25", created_at: "2026-02-24" },
  { id: "3", title: "클라우드 네이티브 아키텍처 입문", status: "draft", is_premium: false, views: 0, published_at: null, created_at: "2026-02-20" },
  { id: "4", title: "React Server Components 실전 가이드", status: "published", is_premium: false, views: 567, published_at: "2026-02-18", created_at: "2026-02-17" },
  { id: "5", title: "타입스크립트 5.0 새 기능 정리", status: "published", is_premium: true, views: 198, published_at: "2026-02-10", created_at: "2026-02-09" },
  { id: "6", title: "마이크로서비스 vs 모놀리스 (작성 중)", status: "draft", is_premium: false, views: 0, published_at: null, created_at: "2026-02-05" },
];

type Filter = "all" | "published" | "draft";

export default function PostsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredPosts = allPosts.filter((post) => {
    if (filter === "all") return true;
    return post.status === filter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">글 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {allPosts.length}개의 글</p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 글 작성
          </Button>
        </Link>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key: "all" as Filter, label: "전체" },
          { key: "published" as Filter, label: "발행됨" },
          { key: "draft" as Filter, label: "초안" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 글 목록 */}
      <Card padding={false}>
        <div className="divide-y divide-gray-100">
          {filteredPosts.map((post) => (
            <div key={post.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate"
                  >
                    {post.title}
                  </Link>
                  {post.is_premium && <Badge variant="warning">유료</Badge>}
                </div>
                <p className="text-xs text-gray-400">
                  {post.status === "published" ? `발행일: ${post.published_at}` : `작성일: ${post.created_at}`}
                  {post.views > 0 && ` · 조회 ${post.views}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={post.status === "published" ? "success" : "default"}>
                  {post.status === "published" ? "발행됨" : "초안"}
                </Badge>
                <Link href={`/dashboard/posts/${post.id}/edit`}>
                  <Button variant="ghost" size="sm">편집</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
