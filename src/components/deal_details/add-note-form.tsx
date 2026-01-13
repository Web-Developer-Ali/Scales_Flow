"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"

interface AddNoteFormProps {
  noteText: string
  onTextChange: (text: string) => void
  onSubmit: () => void
  onCancel: () => void
  isOpen: boolean
}

export function AddNoteForm({ noteText, onTextChange, onSubmit, onCancel, isOpen }: AddNoteFormProps) {
  if (!isOpen) return null

  return (
    <Card className="bg-card border-border border-blue-500/30 bg-blue-500/5">
      <CardHeader className="flex items-center justify-between flex-row pb-3">
        <CardTitle>Add New Note</CardTitle>
        <button onClick={onCancel} className="hover:bg-secondary rounded p-1">
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Note Content</label>
          <Textarea
            placeholder="Enter your note here... (e.g., Client requested additional features, discussed timeline, key decision makers)"
            className="min-h-32 bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
            value={noteText}
            onChange={(e) => onTextChange(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button onClick={onSubmit} className="bg-black hover:bg-black/80 flex-1" disabled={!noteText.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Save Note
          </Button>
          <Button onClick={onCancel} variant="outline" className="bg-transparent flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
