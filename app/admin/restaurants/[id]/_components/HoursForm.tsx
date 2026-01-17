"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const days = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];

type HoursEntry = {
  day_of_week: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

type HoursFormProps = {
  initialData: HoursEntry[];
  action: (formData: FormData) => Promise<void>;
};

function formatTime(value: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

export default function HoursForm({ initialData, action }: HoursFormProps) {
  const byDay = new Map(
    initialData.map((entry) => [entry.day_of_week, entry])
  );

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Horarios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {days.map((day) => {
            const entry = byDay.get(day.value);
            const isClosed = entry?.is_closed ?? false;
            return (
              <div
                key={day.value}
                className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto_auto_auto]"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{day.label}</Label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      name={`hours_${day.value}_is_closed`}
                      defaultChecked={isClosed}
                    />
                    Cerrado
                  </label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`hours_${day.value}_opens_at`}>Abre</Label>
                  <Input
                    id={`hours_${day.value}_opens_at`}
                    name={`hours_${day.value}_opens_at`}
                    type="time"
                    defaultValue={formatTime(entry?.opens_at ?? null)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`hours_${day.value}_closes_at`}>Cierra</Label>
                  <Input
                    id={`hours_${day.value}_closes_at`}
                    name={`hours_${day.value}_closes_at`}
                    type="time"
                    defaultValue={formatTime(entry?.closes_at ?? null)}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit">Guardar horarios</Button>
      </div>
    </form>
  );
}
