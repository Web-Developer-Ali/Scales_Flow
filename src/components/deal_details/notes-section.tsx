"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Note {
  date: string
  author: string
  text: string
}

interface NotesSectionProps {
  notes: Note[]
  onAddNoteClick: () => void
}

export function NotesSection({ notes, onAddNoteClick }: NotesSectionProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle>Notes</CardTitle>
        <Button onClick={onAddNoteClick} size="sm" className="bg-black hover:bg-black/80">
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note, idx) => (
              <div key={idx} className="pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-foreground">{note.author}</p>
                  <p className="text-xs text-muted-foreground">{note.date}</p>
                </div>
                <p className="text-sm text-muted-foreground">{note.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No notes yet. Add one to get started.</p>
        )}
      </CardContent>
    </Card>
  )
}
