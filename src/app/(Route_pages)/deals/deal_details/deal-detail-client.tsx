"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  Users,
  FileText,
  Handshake,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/deal_details/confirmation-dialog";
import { DealHeader } from "@/components/deal_details/deal-header";
import { ContactInformation } from "@/components/deal_details/contact-information";
import { AddProgressForm } from "@/components/deal_details/add-progress-form";
import { AddNoteForm } from "@/components/deal_details/add-note-form";
import { ActivityTimeline } from "@/components/deal_details/activity-timeline";
import { NotesSection } from "@/components/deal_details/notes-section";
import { StageSelector } from "@/components/deal_details/stage-selector";

interface DealDetailClientProps {
  dealId: string;
}

interface Activity {
  type: string;
  date: string;
  time: string;
  notes: string;
  icon: React.ReactNode;
}

interface Note {
  date: string;
  author: string;
  text: string;
}

export function DealDetailClient({ dealId }: DealDetailClientProps) {
  const router = useRouter();

  // State management
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [nextAction, setNextAction] = useState("Email");
  const [selectedStage, setSelectedStage] = useState("Negotiation");
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: () => {},
  });

  const [activities, setActivities] = useState<Activity[]>([
    {
      type: "Call",
      date: "2024-01-20",
      time: "2:30 PM",
      notes: "Discussed pricing and contract terms with procurement team",
      icon: <Phone className="w-4 h-4" />,
    },
    {
      type: "Email",
      date: "2024-01-18",
      time: "10:00 AM",
      notes: "Sent detailed proposal document with pricing breakdown",
      icon: <Mail className="w-4 h-4" />,
    },
    {
      type: "Meeting",
      date: "2024-01-15",
      time: "3:00 PM",
      notes: "Product demo for CTO and technical team",
      icon: <Users className="w-4 h-4" />,
    },
  ]);

  const [notes, setNotes] = useState<Note[]>([
    {
      date: "2024-01-20",
      author: "You",
      text: "Demo went exceptionally well. Client showed strong interest in premium tier features.",
    },
    {
      date: "2024-01-18",
      author: "You",
      text: "Initial discovery call completed successfully. Identified key pain points.",
    },
  ]);

  // Deal data
  const deal = {
    id: dealId,
    company: "TechCorp Solutions",
    value: "$95,000",
    stage: selectedStage,
    probability: "85%",
    contact: "John Smith",
    title: "Chief Technology Officer",
    email: "john@techcorp.com",
    phone: "(555) 123-4567",
    description: "Enterprise software licensing deal for entire organization",
    createdDate: "2024-01-15",
    expectedCloseDate: "2024-02-10",
  };

  const stages = ["Discovery", "Demo", "Proposal", "Negotiation", "Closed Won"];

  // Helper function to get action icon
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "Call":
        return <Phone className="w-4 h-4" />;
      case "Email":
        return <Mail className="w-4 h-4" />;
      case "Meeting":
        return <Users className="w-4 h-4" />;
      case "Demo":
        return <Users className="w-4 h-4" />;
      case "Proposal":
        return <FileText className="w-4 h-4" />;
      case "Negotiation":
        return <Handshake className="w-4 h-4" />;
      case "Contract":
        return <FileText className="w-4 h-4" />;
      case "Follow-up":
        return <Calendar className="w-4 h-4" />;
      case "Other":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  // Confirmation dialog handler
  const showConfirmation = (config: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    setDialogConfig({
      title: config.title,
      description: config.description,
      confirmText: config.confirmText || "Confirm",
      cancelText: config.cancelText || "Cancel",
      onConfirm: config.onConfirm,
    });
    setShowConfirmDialog(true);
  };

  // Handle add progress
  const handleAddProgress = () => {
    if (progressText.trim()) {
      showConfirmation({
        title: `Add ${nextAction} Progress`,
        description: `Are you sure you want to log this ${nextAction.toLowerCase()} progress update?`,
        confirmText: `Log ${nextAction}`,
        onConfirm: () => {
          const newActivity: Activity = {
            type: nextAction,
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            notes: progressText,
            icon: getActionIcon(nextAction),
          };
          setActivities([newActivity, ...activities]);
          setProgressText("");
          setNextAction("Email");
          setShowAddProgress(false);
          setShowConfirmDialog(false);
        },
      });
    }
  };

  // Handle advance stage
  const handleAdvanceStage = (newStage: string) => {
    if (newStage === selectedStage) return;

    const newStageIndex = stages.indexOf(newStage);
    const currentStageIndex = stages.indexOf(selectedStage);

    if (newStageIndex < currentStageIndex) {
      showConfirmation({
        title: "Move to Previous Stage",
        description: `Moving back to "${newStage}" is not allowed. You can only move forward in the sales process.`,
        confirmText: "Cancel",
        cancelText: "OK",
        onConfirm: () => {
          setShowConfirmDialog(false);
        },
      });
      return;
    }

    showConfirmation({
      title: "Move to Next Stage",
      description: `Are you sure you want to advance this deal from "${selectedStage}" to "${newStage}"?`,
      confirmText: `Advance to ${newStage}`,
      onConfirm: () => {
        setSelectedStage(newStage);
        const advanceActivity: Activity = {
          type: "Stage Change",
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          notes: `Deal advanced from ${selectedStage} to ${newStage}`,
          icon: <CheckCircle className="w-4 h-4" />,
        };
        setActivities([advanceActivity, ...activities]);
        setShowConfirmDialog(false);
      },
    });
  };

  // Handle add note
  const handleSaveNote = () => {
    if (noteText.trim()) {
      showConfirmation({
        title: "Add New Note",
        description: "Are you sure you want to add this note?",
        confirmText: "Add Note",
        onConfirm: () => {
          const newNote: Note = {
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            author: "You",
            text: noteText,
          };
          setNotes([newNote, ...notes]);
          setNoteText("");
          setShowAddNote(false);
          setShowConfirmDialog(false);
        },
      });
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
      />

      <DealHeader
        company={deal.company}
        value={deal.value}
        stage={deal.stage}
        probability={deal.probability}
        description={deal.description}
        expectedCloseDate={deal.expectedCloseDate}
        onBack={() => router.back()}
      />

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          <ContactInformation
            contact={deal.contact}
            title={deal.title}
            email={deal.email}
            phone={deal.phone}
          />

          <AddProgressForm
            isOpen={showAddProgress}
            nextAction={nextAction}
            onActionChange={setNextAction}
            progressText={progressText}
            onTextChange={setProgressText}
            onSubmit={handleAddProgress}
            onCancel={() => setShowAddProgress(false)}
          />

          <AddNoteForm
            isOpen={showAddNote}
            noteText={noteText}
            onTextChange={setNoteText}
            onSubmit={handleSaveNote}
            onCancel={() => setShowAddNote(false)}
          />

          <ActivityTimeline activities={activities} />

          <NotesSection
            notes={notes}
            onAddNoteClick={() => setShowAddNote(true)}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <StageSelector
            stages={stages}
            currentStage={selectedStage}
            onStageSelect={handleAdvanceStage}
            onAddProgressClick={() => setShowAddProgress(true)}
          />
        </div>
      </div>
    </main>
  );
}
