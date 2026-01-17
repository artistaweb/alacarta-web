import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center">
      {/* Light */}
      <img
        src="/brand/logo-light.svg"
        alt="A la Carta PR"
        className="block h-15 w-auto dark:hidden"
        loading="eager"
      />

      {/* Dark */}
      <img
        src="/brand/logo-dark.svg"
        alt="A la Carta PR"
        className="hidden h-15 w-auto dark:block"
        loading="eager"
      />
    </Link>
  );
}
