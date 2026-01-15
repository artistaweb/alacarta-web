import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide text-white transition-colors hover:text-white/90"
        >
          A la Carta
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/"
            className="text-white/70 transition-colors hover:text-white"
          >
            Inicio
          </Link>
          <Link
            href="/explorar"
            className="text-white/70 transition-colors hover:text-white"
          >
            Explorar
          </Link>
        </nav>
      </div>
    </header>
  );
}
