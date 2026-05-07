import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-semibold">
          AIForge Builder
        </h1>
        <p className="text-slate-400">
          Costruisci app full‑stack tramite conversazione.
        </p>
        <Link
          href="/emergent-clone"
          className="inline-flex items-center px-4 py-2 rounded-md bg-accent text-slate-900 font-medium"
        >
          Entra nel workspace
        </Link>
      </div>
    </main>
  );
}
