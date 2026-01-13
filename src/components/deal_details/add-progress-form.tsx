"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"
import { Phone, Mail, Users, FileText, Handshake, Calendar, CheckCircle } from "lucide-react"

interface AddProgressFormProps {
  nextAction: string
  onActionChange: (action: string) => void
  progressText: string
  onTextChange: (text: string) => void
  onSubmit: () => void
  onCancel: () => void
  isOpen: boolean
}

export function AddProgressForm({
  nextAction,
  onActionChange,
  progressText,
  onTextChange,
  onSubmit,
  onCancel,
  isOpen,
}: AddProgressFormProps) {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "Call":
        return <Phone className="w-4 h-4" />
      case "Email":
        return <Mail className="w-4 h-4" />
      case "Meeting":
        return <Users className="w-4 h-4" />
      case "Demo":
        return <Users className="w-4 h-4" />
      case "Proposal":
        return <FileText className="w-4 h-4" />
      case "Negotiation":
        return <Handshake className="w-4 h-4" />
      case "Contract":
        return <FileText className="w-4 h-4" />
      case "Follow-up":
        return <Calendar className="w-4 h-4" />
      case "Other":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  if (!isOpen) return null

  return (
    <Card className="bg-card border-border border-blue-500/30 bg-blue-500/5">
      <CardHeader className="flex items-center justify-between flex-row pb-3">
        <div className="flex items-center gap-2">
          {getActionIcon(nextAction)}
          <CardTitle>Log {nextAction}</CardTitle>
        </div>
        <button onClick={onCancel} className="hover:bg-secondary rounded p-1">
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Activity Type</label>
          <select
            value={nextAction}
            onChange={(e) => onActionChange(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Call">Phone Call</option>
            <option value="Email">Email</option>
            <option value="Meeting">Meeting</option>
            <option value="Demo">Product Demo</option>
            <option value="Proposal">Proposal Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Contract">Contract Review</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Activity Details</label>
          <Textarea
            placeholder={`Describe your ${nextAction.toLowerCase()}...`}
            className="min-h-24 bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
            value={progressText}
            onChange={(e) => onTextChange(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button onClick={onSubmit} className="bg-black hover:bg-black/80 flex-1" disabled={!progressText.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Log {nextAction}
          </Button>
          <Button onClick={onCancel} variant="outline" className="bg-transparent flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
