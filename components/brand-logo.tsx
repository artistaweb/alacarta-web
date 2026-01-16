import Image from "next/image";
import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      {/* Light */}
      <Image
        src="/brand/logo-light.png"
        alt="A la Carta PR"
        width={160}
        height={40}
        priority
        className="block dark:hidden"
      />

      {/* Dark */}
      <Image
        src="/brand/logo-dark.png"
        alt="A la Carta PR"
        width={160}
        height={40}
        priority
        className="hidden dark:block"
      />
    </Link>
  );
}
