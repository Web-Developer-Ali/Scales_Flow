"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamManagementHeader } from "@/components/addTeamMember_admin/team-management-header";
import { CreateTeamMemberDialog } from "@/components/addTeamMember_admin/create-team-member-dialog";
import { TeamTable } from "@/components/addTeamMember_admin/team-table";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
}

interface Summary {
  totalTeamMembers: number;
  managers: number;
  salesReps: number;
}

export function TeamManagementPageClient() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalTeamMembers: 0,
    managers: 0,
    salesReps: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch team data on mount
  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/getData_forCreateUser");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch team data");
      }

      if (data.success) {
        setTeamMembers(data.teamMembers);
        setSummary(data.summary);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching team data:", err);
      setError(err instanceof Error ? err.message : "Failed to load team data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (data: any) => {
    try {
      // Optimistically update UI
      const newMember: TeamMember = {
        id: `temp-${Date.now()}`,
        ...data,
        status: "active",
        joinDate: new Date().toISOString().split("T")[0],
      };
      setTeamMembers([...teamMembers, newMember]);
      setSummary((prev) => ({
        totalTeamMembers: prev.totalTeamMembers + 1,
        managers: data.role === "Manager" ? prev.managers + 1 : prev.managers,
        salesReps:
          data.role === "Sales Rep" ? prev.salesReps + 1 : prev.salesReps,
      }));

      // Refresh from server to get actual data
      await fetchTeamData();
    } catch (err) {
      console.error("Error adding team member:", err);
      setError("Failed to add team member");
      // Revert optimistic update
      await fetchTeamData();
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const memberToDelete = teamMembers.find((m) => m.id === id);

      // Optimistically update UI
      setTeamMembers(teamMembers.filter((member) => member.id !== id));
      if (memberToDelete) {
        setSummary((prev) => ({
          totalTeamMembers: prev.totalTeamMembers - 1,
          managers:
            memberToDelete.role === "Manager"
              ? prev.managers - 1
              : prev.managers,
          salesReps:
            memberToDelete.role === "Sales Rep"
              ? prev.salesReps - 1
              : prev.salesReps,
        }));
      }

      // Refresh from server to confirm deletion
      await fetchTeamData();
    } catch (err) {
      console.error("Error deleting team member:", err);
      setError("Failed to delete team member");
      // Revert optimistic update
      await fetchTeamData();
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <TeamManagementHeader />
        <div className="px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <TeamManagementHeader />

      <div className="px-6 py-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Team Members
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalTeamMembers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all roles
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Managers
              </CardTitle>
              <UserPlus className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.managers}</div>
              <p className="text-xs text-muted-foreground mt-1">Team leaders</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sales Reps
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.salesReps}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Individual contributors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Management */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your managers and sales representatives
              </CardDescription>
            </div>
            <CreateTeamMemberDialog onAddMember={handleAddMember} />
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No team members found. Add your first team member to get
                started.
              </div>
            ) : (
              <TeamTable
                teamMembers={teamMembers}
                onDeleteMember={handleDeleteMember}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
