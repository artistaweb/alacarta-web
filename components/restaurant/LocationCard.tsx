import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  name: string;
  address?: string | null;
  municipio?: string | null;
  zone?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapsUrl?: string | null;
};

export default function LocationCard({
  name,
  address,
  municipio,
  zone,
  lat,
  lng,
  mapsUrl,
}: Props) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Ubicación</CardTitle>
        {mapsUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              Abrir en Maps
            </a>
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {address ? <p>{address}</p> : null}
          {(municipio || zone) ? (
            <p>{[municipio, zone].filter(Boolean).join(", ")}</p>
          ) : null}
        </div>

        {hasCoords ? (
          <div className="overflow-hidden rounded-xl border">
            <iframe
              title={`Mapa de ${name}`}
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Coordenadas no disponibles para mostrar el mapa.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
