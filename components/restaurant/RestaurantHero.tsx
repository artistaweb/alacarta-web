import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type Props = {
  name: string;
  coverUrl?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  municipio?: string | null;
  zone?: string | null;
  priceText?: string | null;
  phone?: string | null;
  website?: string | null;
  mapsUrl?: string | null;
};

export default function RestaurantHero({
  name,
  coverUrl,
  category,
  municipio,
  zone,
  priceText,
  phone,
  website,
  mapsUrl,
}: Props) {
  const subtitle = [municipio, zone].filter(Boolean).join(" · ");

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-7 overflow-hidden rounded-2xl border">
        <AspectRatio ratio={16 / 9}>
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-sm text-muted-foreground">Sin imagen</span>
            </div>
          )}
        </AspectRatio>
      </div>

      <div className="lg:col-span-5 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {category ? <Badge variant="secondary">{category.name}</Badge> : null}
            {priceText ? <Badge variant="outline">{priceText}</Badge> : null}
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>

          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {mapsUrl ? (
            <Button asChild>
              <a href={mapsUrl} target="_blank" rel="noreferrer" aria-label="Abrir en Google Maps">
                Ver en mapa
              </a>
            </Button>
          ) : null}

          {phone ? (
            <Button asChild variant="secondary">
              <a href={`tel:${phone}`} aria-label="Llamar">
                Llamar
              </a>
            </Button>
          ) : null}

          {website ? (
            <Button asChild variant="outline">
              <a href={website} target="_blank" rel="noreferrer" aria-label="Abrir website">
                Website
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
