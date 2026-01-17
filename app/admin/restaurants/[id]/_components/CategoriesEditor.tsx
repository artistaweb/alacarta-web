"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { slugify } from "@/lib/slug";
import { createBrowserClient } from "@/lib/supabase/browser";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type CategoriesEditorProps = {
  restaurantId: string;
  categories: Category[];
  assignedCategoryIds: string[];
};

export default function CategoriesEditor({
  restaurantId,
  categories,
  assignedCategoryIds,
}: CategoriesEditorProps) {
  const [availableCategories, setAvailableCategories] =
    useState<Category[]>(categories);
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedCategoryIds);
  const [baselineIds, setBaselineIds] =
    useState<string[]>(assignedCategoryIds);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categoriesById = useMemo(() => {
    return new Map(availableCategories.map((category) => [category.id, category]));
  }, [availableCategories]);

  const selectedCategories = selectedIds
    .map((id) => categoriesById.get(id))
    .filter((category): category is Category => Boolean(category));

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    const supabase = createBrowserClient();

    const initialSet = new Set(baselineIds);
    const currentSet = new Set(selectedIds);

    const toInsert = Array.from(currentSet).filter((id) => !initialSet.has(id));
    const toDelete = Array.from(initialSet).filter((id) => !currentSet.has(id));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("restaurant_categories")
        .insert(
          toInsert.map((categoryId) => ({
            restaurant_id: restaurantId,
            category_id: categoryId,
          }))
        );

      if (insertError) {
        setError("No se pudieron guardar las categorias.");
        setIsSaving(false);
        return;
      }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("restaurant_categories")
        .delete()
        .eq("restaurant_id", restaurantId)
        .in("category_id", toDelete);

      if (deleteError) {
        setError("No se pudieron guardar las categorias.");
        setIsSaving(false);
        return;
      }
    }

    setSuccess("Categorias guardadas.");
    setBaselineIds(selectedIds);
    setIsSaving(false);
  }

  async function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const supabase = createBrowserClient();
    const slug = slugify(trimmed);

    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({ name: trimmed, slug })
      .select("id, name, slug")
      .single();

    if (insertError || !data) {
      setError("No se pudo crear la categoria.");
      setIsSaving(false);
      return;
    }

    setAvailableCategories((prev) => [...prev, data]);
    setSelectedIds((prev) => Array.from(new Set([...prev, data.id])));
    setNewCategoryName("");
    setSuccess("Categoria creada y asignada.");
    setIsSaving(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Categorias asignadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_select">Agregar categoria</Label>
            <Select
              id="category_select"
              value=""
              onChange={(event) => {
                const nextId = event.target.value;
                if (!nextId) return;
                setSelectedIds((prev) =>
                  prev.includes(nextId) ? prev : [...prev, nextId]
                );
              }}
            >
              <option value="">Selecciona una categoria</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin categorias asignadas.
              </p>
            ) : (
              selectedCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {category.name}
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setSelectedIds((prev) =>
                        prev.filter((id) => id !== category.id)
                      )
                    }
                  >
                    Quitar
                  </button>
                </Badge>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new_category_name">Nueva categoria</Label>
              <Input
                id="new_category_name"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Ej: Mariscos"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddCategory}
              disabled={isSaving || !newCategoryName.trim()}
            >
              Anadir categoria
            </Button>
          </div>

          {(error || success) && (
            <p className="text-sm text-muted-foreground">{error ?? success}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          Guardar categorias
        </Button>
      </div>
    </div>
  );
}
