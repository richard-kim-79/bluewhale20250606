"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SettingsPage() {
  const [newsletter, setNewsletter] = useState({
    title: "테크 인사이트",
    description: "매주 IT 업계의 핵심 뉴스와 트렌드를 깊이 있게 분석합니다.",
    is_paid: true,
    price_monthly: 9900,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">뉴스레터 설정</h1>
        <p className="text-sm text-gray-500 mt-1">뉴스레터 정보와 결제 설정을 관리합니다</p>
      </div>

      <div className="space-y-6">
        {/* 기본 정보 */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">커버 이미지</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">이미지를 드래그하거나 클릭하여 업로드</p>
              </div>
            </div>
            <Button>변경 사항 저장</Button>
          </div>
        </Card>

        {/* 유료 구독 설정 */}
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
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    newsletter.is_paid ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {newsletter.is_paid && (
              <Input
                label="월 구독료 (원)"
                type="number"
                value={newsletter.price_monthly.toString()}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, price_monthly: parseInt(e.target.value) || 0 })
                }
              />
            )}
            <Button>결제 설정 저장</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
