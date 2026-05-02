/**
 * Header Component - Aethersy AI Platform
 */

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Aethersy AI</h1>
              <p className="text-xs text-purple-300">Platform for Entrepreneurs</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/tools" className="text-white/70 hover:text-white transition-colors">
              Strumenti AI
            </Link>
            <Link href="/templates" className="text-white/70 hover:text-white transition-colors">
              Template
            </Link>
            <Link href="/marketplace" className="text-white/70 hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/terminal" className="text-white/70 hover:text-white transition-colors">
              Terminal
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
            >
              Profilo
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
