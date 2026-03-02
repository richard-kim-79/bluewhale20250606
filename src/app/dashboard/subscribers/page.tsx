"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";

// 더미 데이터
const subscribers = [
  { id: "1", name: "홍길동", email: "hong@example.com", is_paid: true, status: "active", subscribed_at: "2026-03-01" },
  { id: "2", name: "김철수", email: "kim@example.com", is_paid: false, status: "active", subscribed_at: "2026-02-28" },
  { id: "3", name: "이영희", email: "lee@example.com", is_paid: true, status: "active", subscribed_at: "2026-02-27" },
  { id: "4", name: "박민수", email: "park@example.com", is_paid: false, status: "active", subscribed_at: "2026-02-26" },
  { id: "5", name: "정수진", email: "jung@example.com", is_paid: true, status: "active", subscribed_at: "2026-02-20" },
  { id: "6", name: "최현우", email: "choi@example.com", is_paid: false, status: "cancelled", subscribed_at: "2026-02-15" },
  { id: "7", name: "강서연", email: "kang@example.com", is_paid: true, status: "active", subscribed_at: "2026-02-10" },
  { id: "8", name: "윤도현", email: "yoon@example.com", is_paid: false, status: "active", subscribed_at: "2026-02-05" },
];

type Filter = "all" | "paid" | "free";

export default function SubscribersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filteredSubs = subscribers.filter((sub) => {
    if (filter === "paid" && !sub.is_paid) return false;
    if (filter === "free" && sub.is_paid) return false;
    if (search && !sub.name.includes(search) && !sub.email.includes(search)) return false;
    return true;
  });

  const totalPaid = subscribers.filter((s) => s.is_paid).length;
  const totalFree = subscribers.filter((s) => !s.is_paid).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">구독자 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          총 {subscribers.length}명 (유료 {totalPaid}명 / 무료 {totalFree}명)
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-500">전체 구독자</p>
          <p className="text-2xl font-bold text-gray-900">{subscribers.length}명</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">유료 구독자</p>
          <p className="text-2xl font-bold text-primary-600">{totalPaid}명</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">무료 구독자</p>
          <p className="text-2xl font-bold text-gray-600">{totalFree}명</p>
        </Card>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="이름 또는 이메일로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: "all" as Filter, label: "전체" },
            { key: "paid" as Filter, label: "유료" },
            { key: "free" as Filter, label: "무료" },
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
      </div>

      {/* 구독자 목록 */}
      <Card padding={false}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">구독자</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">유형</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">상태</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">구독일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSubs.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={sub.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                      <p className="text-xs text-gray-400">{sub.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={sub.is_paid ? "info" : "default"}>
                    {sub.is_paid ? "유료" : "무료"}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={sub.status === "active" ? "success" : "danger"}>
                    {sub.status === "active" ? "활성" : "해지"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{sub.subscribed_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
