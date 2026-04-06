import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">뉴스레터</span>
          </div>

          <nav className="flex items-center gap-6">
            <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-700">탐색</Link>
            <span className="text-sm text-gray-500">이용약관</span>
            <span className="text-sm text-gray-500">개인정보처리방침</span>
          </nav>

          <p className="text-sm text-gray-400">
            &copy; 2026 뉴스레터 플랫폼
          </p>
        </div>
      </div>
    </footer>
  );
}
