"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/category"
import { Category } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Check, X, Tag, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CategoryManagerProps {
  categories: Category[]
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter()

  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingError, setEditingError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setCreating(true)
    const result = await createCategory(trimmed)
    setCreating(false)
    if (result.success) {
      setNewName("")
      toast({ title: "Category created" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditingError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName("")
    setEditingError(null)
  }

  async function handleSaveEdit(id: string) {
    const trimmed = editingName.trim()
    if (!trimmed) {
      setEditingError("Category name cannot be empty")
      return
    }
    setEditingError(null)
    setSavingId(id)
    const result = await updateCategory(id, trimmed)
    setSavingId(null)
    if (result.success) {
      setEditingId(null)
      setEditingError(null)
      toast({ title: "Category updated" })
      router.refresh()
    } else {
      setEditingError(result.error ?? "Failed to update category")
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    const result = await deleteCategory(id)
    setDeleting(false)
    setDeletingId(null)
    if (result.success) {
      toast({ title: "Category deleted" })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      {/* Add new category */}
      <div className="flex gap-2">
        <Input
          placeholder="New category name (e.g. Sarees, Tops)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          disabled={creating}
          className="flex-1 min-w-0"
        />
        <Button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="bg-whatsapp hover:bg-whatsapp-dark text-white shrink-0"
        >
          {creating ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </>
          )}
        </Button>
      </div>

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Tag className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">No categories yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add categories to organise your products
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <ul className="divide-y divide-border">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20">
                <Tag className="w-4 h-4 text-muted-foreground shrink-0 mt-1.5" />

                {editingId === cat.id ? (
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => { setEditingName(e.target.value); setEditingError(null) }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(cat.id)
                          if (e.key === "Escape") cancelEdit()
                        }}
                        className={`h-8 flex-1 min-w-0 ${editingError ? "border-destructive" : ""}`}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-green-600 hover:text-green-700"
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={savingId === cat.id}
                      >
                        {savingId === cat.id ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground"
                        onClick={cancelEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {editingError && (
                      <p className="text-xs text-destructive px-1">{editingError}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(cat)}
                        title="Rename"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(cat.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Products in this category will not be deleted — they will simply have no category assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={deleting}
            >
              {deleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
