import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  address?: string | null;
  municipio?: string | null;
  zone?: string | null;
  phone?: string | null;
  website?: string | null;
  priceText?: string | null;
};

export default function QuickFacts({
  address,
  municipio,
  zone,
  phone,
  website,
  priceText,
}: Props) {
  const area = [municipio, zone].filter(Boolean).join(", ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Información rápida</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground">
        {address ? <div><span className="text-foreground">Dirección:</span> {address}</div> : null}
        {area ? <div><span className="text-foreground">Área:</span> {area}</div> : null}
        {priceText ? <div><span className="text-foreground">Precio:</span> {priceText}</div> : null}
        {phone ? <div><span className="text-foreground">Teléfono:</span> {phone}</div> : null}
        {website ? <div><span className="text-foreground">Website:</span> {website}</div> : null}
      </CardContent>
    </Card>
  );
}
