"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isWriter, setIsWriter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, is_writer: isWriter },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 작가라면 기본 뉴스레터도 자동 생성
    if (isWriter) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("newsletters").insert({
          writer_id: user.id,
          title: `${name}의 뉴스레터`,
          description: "",
        });
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="text-sm text-gray-500 mt-2">뉴스레터를 구독하고 나만의 글을 시작하세요</p>
        </div>

        <Card>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
            )}
            <Input
              id="name"
              label="이름"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="email"
              label="이메일"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="비밀번호"
              type="password"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setIsWriter(!isWriter)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isWriter ? "bg-primary-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isWriter ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              <div>
                <span className="text-sm font-medium text-gray-700">작가로 가입</span>
                <p className="text-xs text-gray-400">뉴스레터를 발행하고 구독자를 모을 수 있습니다</p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "가입 중..." : "가입하기"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
