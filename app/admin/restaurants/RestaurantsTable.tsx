"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RestaurantListItem = {
  id: string;
  name: string | null;
  status: string | null;
  updated_at: string | null;
};

type RestaurantsTableProps = {
  initialRestaurants: RestaurantListItem[];
};

export default function RestaurantsTable({
  initialRestaurants,
}: RestaurantsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return initialRestaurants;

    return initialRestaurants.filter((restaurant) =>
      (restaurant.name ?? "").toLowerCase().includes(normalized)
    );
  }, [initialRestaurants, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Restaurantes</h2>
          <p className="text-sm text-muted-foreground">
            Administra el inventario y estado de publicación.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/restaurants/new">Nuevo restaurante</Link>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nombre"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((restaurant) => (
              <TableRow key={restaurant.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/restaurants/${restaurant.id}`}
                    className="hover:underline"
                  >
                    {restaurant.name ?? "Sin nombre"}
                  </Link>
                </TableCell>
                <TableCell className="capitalize">
                  {restaurant.status ?? "-"}
                </TableCell>
                <TableCell>
                  {restaurant.updated_at
                    ? new Date(restaurant.updated_at).toLocaleString("es-PR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm">
                  No hay restaurantes con ese nombre.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
