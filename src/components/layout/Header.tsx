import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import HeaderMobileMenu from "./HeaderMobileMenu";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { name: string; avatar_url: string | null; is_writer: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name, avatar_url, is_writer")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-xl font-bold text-gray-900">뉴스레터</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/explore" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            탐색
          </Link>
          {profile ? (
            <>
              {profile.is_writer && (
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  대시보드
                </Link>
              )}
              <div className="flex items-center gap-3">
                <Avatar name={profile.name} src={profile.avatar_url} size="sm" />
                <SignOutButton />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">로그인</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">시작하기</Button>
              </Link>
            </div>
          )}
        </nav>

        <HeaderMobileMenu isLoggedIn={!!profile} isWriter={profile?.is_writer ?? false} />
      </div>
    </header>
  );
}
