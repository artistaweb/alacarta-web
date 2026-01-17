"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LocationFormProps = {
  initialData: {
    address: string | null;
    municipio: string | null;
    zone: string | null;
    lat: number | null;
    lng: number | null;
  };
  action: (formData: FormData) => Promise<void>;
};

export default function LocationForm({ initialData, action }: LocationFormProps) {
  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ubicacion principal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialData.address ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipio">Municipio</Label>
            <Input
              id="municipio"
              name="municipio"
              defaultValue={initialData.municipio ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone">Zona</Label>
            <Input id="zone" name="zone" defaultValue={initialData.zone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lat">Latitud</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              defaultValue={
                initialData.lat !== null ? String(initialData.lat) : ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitud</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              defaultValue={
                initialData.lng !== null ? String(initialData.lng) : ""
              }
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit">Guardar ubicacion</Button>
      </div>
    </form>
  );
}
