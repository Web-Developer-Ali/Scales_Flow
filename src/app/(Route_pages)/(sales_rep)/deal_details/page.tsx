"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Share2, MoreVertical, Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [selectedStage, setSelectedStage] = useState("Negotiation");
  const [activities, setActivities] = useState([
    {
      type: "Call",
      date: "2024-01-20",
      time: "2:30 PM",
      notes: "Discussed pricing",
    },
    {
      type: "Email",
      date: "2024-01-18",
      time: "10:00 AM",
      notes: "Sent proposal document",
    },
  ]);
  const [notes, setNotes] = useState([
    {
      date: "2024-01-20",
      author: "You",
      text: "Demo went well, client interested in premium tier",
    },
    {
      date: "2024-01-18",
      author: "You",
      text: "Initial discovery call completed",
    },
  ]);

  const deal = {
    id: params.id,
    company: "TechCorp Solutions",
    value: "$95,000",
    stage: selectedStage,
    probability: "85%",
    daysInStage: 5,
    contact: "John Smith",
    email: "john@techcorp.com",
    phone: "(555) 123-4567",
    description: "Enterprise software licensing deal for entire organization",
    createdDate: "2024-01-15",
    expectedCloseDate: "2024-02-10",
  };

  const stages = ["Discovery", "Demo", "Proposal", "Negotiation", "Closed Won"];

  const handleAddProgress = () => {
    if (progressText.trim()) {
      const newActivity = {
        type: "Progress Update",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        notes: progressText,
      };
      setActivities([newActivity, ...activities]);
      setProgressText("");
      setShowAddProgress(false);
    }
  };

  const handleAdvanceStage = (newStage: string) => {
    setSelectedStage(newStage);
    const advanceActivity = {
      type: "Stage Change",
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      notes: `Moved from ${deal.stage} to ${newStage}`,
    };
    setActivities([advanceActivity, ...activities]);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-secondary bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {deal.company}
              </h1>
              <p className="text-muted-foreground mt-2">{deal.description}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Deal Overview */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deal Value</p>
              <p className="text-2xl font-bold text-foreground">{deal.value}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Stage</p>
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-500 border-green-500/30 mt-1"
              >
                {deal.stage}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Probability</p>
              <p className="text-2xl font-bold text-foreground">
                {deal.probability}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Expected Close
              </p>
              <p className="text-sm font-semibold text-foreground">
                {deal.expectedCloseDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Primary Contact
                  </p>
                  <p className="font-semibold text-foreground">
                    {deal.contact}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm text-blue-500">{deal.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm text-foreground">{deal.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {showAddProgress && (
            <Card className="bg-card border-border border-blue-500/30 bg-blue-500/5">
              <CardHeader className="flex items-center justify-between flex-row pb-3">
                <CardTitle>Add Progress Update</CardTitle>
                <button
                  onClick={() => setShowAddProgress(false)}
                  className="hover:bg-secondary rounded p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Progress Notes
                  </label>
                  <Textarea
                    placeholder="Describe your work on this deal... (e.g., Had meeting with stakeholders, discussed pricing, waiting for approval)"
                    className="min-h-24 bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
                    value={progressText}
                    onChange={(e) => setProgressText(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddProgress}
                    className="bg-black hover:bg-black/80 flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log Progress
                  </Button>
                  <Button
                    onClick={() => setShowAddProgress(false)}
                    variant="outline"
                    className="bg-transparent flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deal Timeline & Activities */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="text-xs text-muted-foreground flex-shrink-0 w-24">
                      {activity.date} {activity.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {activity.type}
                        </p>
                        {activity.type === "Stage Change" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs"
                          >
                            Updated
                          </Badge>
                        )}
                        {activity.type === "Progress Update" && (
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-500 border-green-500/30 text-xs"
                          >
                            Work Done
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-card border-border">
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Notes</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">
                        {note.author}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {note.date}
                      </p>
                    </div>
                    <p className="text-sm text-foreground">{note.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => setShowAddProgress(!showAddProgress)}
                className="w-full bg-black hover:bg-black/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Progress
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Deal
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Move to Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stages.map((stage) => (
                <Button
                  key={stage}
                  onClick={() => handleAdvanceStage(stage)}
                  variant={stage === deal.stage ? "default" : "outline"}
                  className={`w-full justify-start ${
                    stage === deal.stage
                      ? "bg-black text-white hover:bg-black/80"
                      : "bg-transparent hover:bg-secondary"
                  }`}
                >
                  {stage}
                  {stage === deal.stage && (
                    <Badge className="ml-auto bg-blue-500/20 text-blue-500 border-0">
                      Current
                    </Badge>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Deal Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm text-foreground">{deal.createdDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Days in Stage
                </p>
                <p className="text-sm text-foreground">
                  {deal.daysInStage} days
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Last Updated
                </p>
                <p className="text-sm text-foreground">2024-01-20</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
