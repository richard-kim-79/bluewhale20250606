"use client";

import { useState } from "react";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

interface Props {
  isLoggedIn: boolean;
  isWriter: boolean;
}

export default function HeaderMobileMenu({ isLoggedIn, isWriter }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2 shadow-lg">
          <Link href="/explore" className="block py-2 text-sm text-gray-600" onClick={() => setOpen(false)}>탐색</Link>
          {isLoggedIn ? (
            <>
              {isWriter && (
                <Link href="/dashboard" className="block py-2 text-sm text-gray-600" onClick={() => setOpen(false)}>대시보드</Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2 text-sm text-gray-600" onClick={() => setOpen(false)}>로그인</Link>
              <Link href="/register" className="block py-2 text-sm text-primary-600 font-medium" onClick={() => setOpen(false)}>시작하기</Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
