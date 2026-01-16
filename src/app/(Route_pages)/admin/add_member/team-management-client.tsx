"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserPlus,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch team data
  const fetchTeamData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await axios.get("/api/admin/getData_forCreateUser");

      if (response.data.success) {
        setTeamMembers(response.data.teamMembers);
        setSummary(response.data.summary);
      } else {
        throw new Error(response.data.error || "Failed to fetch team data");
      }
    } catch (err) {
      console.error("Error fetching team data:", err);
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load team data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Handle successful member creation
  const handleMemberCreated = useCallback(() => {
    fetchTeamData(true);
  }, [fetchTeamData]);

  // Handle member deletion
  const handleDeleteMember = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this team member? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const memberToDelete = teamMembers.find((m) => m.id === id);

      // Optimistically update UI
      setTeamMembers((prev) => prev.filter((member) => member.id !== id));
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

      // Call delete API
      const response = await axios.delete(`/api/admin/deleteUser/${id}`);

      if (!response.data.success) {
        throw new Error("Failed to delete team member");
      }

      // Refresh to ensure consistency
      await fetchTeamData(true);
    } catch (err) {
      console.error("Error deleting team member:", err);
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to delete team member";
      setError(errorMessage);
      // Revert optimistic update
      await fetchTeamData(true);
    }
  };

  // Manual refresh handler
  const handleRefresh = () => {
    fetchTeamData(true);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <TeamManagementHeader />
        <div className="px-6 py-8">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Loading team data...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <TeamManagementHeader />

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="ml-4"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Team Members
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {summary.totalTeamMembers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all roles
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Managers
              </CardTitle>
              <UserPlus className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.managers}</div>
              <p className="text-xs text-muted-foreground mt-1">Team leaders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sales Reps
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.salesReps}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Individual contributors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Management */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Team Members</CardTitle>
              <CardDescription>
                Manage your managers and sales representatives
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <CreateTeamMemberDialog onSuccess={handleMemberCreated} />
            </div>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No team members yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Get started by adding your first team member. They will
                  receive an email with instructions to verify their account.
                </p>
                <CreateTeamMemberDialog onSuccess={handleMemberCreated} />
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
