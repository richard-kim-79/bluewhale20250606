"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface Post {
  id: string;
  title: string;
  is_published: boolean;
  is_premium: boolean;
  published_at: string | null;
  created_at: string;
}

type Filter = "all" | "published" | "draft";

export default function PostsListClient({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredPosts = posts.filter((post) => {
    if (filter === "published") return post.is_published;
    if (filter === "draft") return !post.is_published;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">글 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {posts.length}개의 글</p>
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

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { key: "all", label: "전체" },
          { key: "published", label: "발행됨" },
          { key: "draft", label: "초안" },
        ] as { key: Filter; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredPosts.length > 0 ? (
        <Card padding={false}>
          <div className="divide-y divide-gray-100">
            {filteredPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/dashboard/posts/${post.id}/edit`} className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate">
                      {post.title}
                    </Link>
                    {post.is_premium && <Badge variant="warning">유료</Badge>}
                  </div>
                  <p className="text-xs text-gray-400">
                    {post.is_published
                      ? `발행일: ${new Date(post.published_at!).toLocaleDateString("ko-KR")}`
                      : `작성일: ${new Date(post.created_at).toLocaleDateString("ko-KR")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={post.is_published ? "success" : "default"}>
                    {post.is_published ? "발행됨" : "초안"}
                  </Badge>
                  <Link href={`/dashboard/posts/${post.id}/edit`}>
                    <Button variant="ghost" size="sm">편집</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-400 mb-4">아직 작성한 글이 없습니다</p>
          <Link href="/dashboard/posts/new">
            <Button>첫 글 작성하기</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
