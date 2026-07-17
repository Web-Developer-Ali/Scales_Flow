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
  Ban,
  Unlock,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreateTeamMemberDialog } from "@/components/admin/addTeamMember_admin/create-team-member-dialog";
import { TeamTable } from "@/components/admin/addTeamMember_admin/team-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ConfirmAction,
  ConfirmState,
  Summary,
  TeamMember,
} from "@/types/admin/add_member";
import { AdminNavbar } from "@/components/admin/navbar";

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

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    action: null,
    memberId: null,
    memberName: "",
  });

  const route = useRouter();

  const fetchTeamData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      const { data } = await axios.get("/api/admin/getData_forCreateUser");

      if (data.success) {
        setTeamMembers(data.teamMembers);
        setSummary(data.summary);
      } else {
        throw new Error(data.error || "Failed to fetch team data");
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load team data";

      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const loadTeamData = async () => {
      await fetchTeamData();
    };

    loadTeamData();
  }, [fetchTeamData]);

  const handleMemberCreated = useCallback(() => {
    fetchTeamData(true);
  }, [fetchTeamData]);

  // Confirm Dialog Helpers

  const openConfirmDialog = (
    action: ConfirmAction,
    memberId: string,
    memberName: string,
  ) => {
    setConfirmState({
      open: true,
      action,
      memberId,
      memberName,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmState({
      open: false,
      action: null,
      memberId: null,
      memberName: "",
    });
  };

  // Actions

  const blockUser = async (id: string) => {
    try {
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "blocked" } : m)),
      );

      const { data } = await axios.patch(
        `/api/admin/blockUser/${id}?action=block`,
      );

      if (!data.success) {
        throw new Error(data.error || "Failed to block user");
      }

      toast.success(data.message);

      await fetchTeamData(true);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to block user";

      setError(message);

      await fetchTeamData(true);
    }
  };

  // unblock user
  const unblockUser = async (id: string) => {
    try {
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "active" } : m)),
      );

      const { data } = await axios.patch(
        `/api/admin/blockUser/${id}?action=unblock`,
      );

      if (!data.success) {
        throw new Error(data.error || "Failed to unblock user");
      }

      toast.success(data.message);

      await fetchTeamData(true);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to unblock user";

      setError(message);

      await fetchTeamData(true);
    }
  };

  // delete user
  const deleteUser = async (id: string) => {
    try {
      const memberToDelete = teamMembers.find((m) => m.id === id);

      setTeamMembers((prev) => prev.filter((m) => m.id !== id));

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

      const { data } = await axios.delete(`/api/admin/deleteUser/${id}`);

      if (!data.success) {
        throw new Error(data.error || "Failed to delete user");
      }

      toast.success(data.message);

      await fetchTeamData(true);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to delete user";

      setError(message);

      await fetchTeamData(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState.memberId || !confirmState.action) return;

    const { memberId, action } = confirmState;

    closeConfirmDialog();

    if (action === "block") {
      await blockUser(memberId);
    }

    if (action === "unblock") {
      await unblockUser(memberId);
    }

    if (action === "delete") {
      await deleteUser(memberId);
    }
  };

  // Loading

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <AdminNavbar />

        <div className="px-6 py-8 flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />

          <p className="text-sm text-muted-foreground">Loading team data...</p>
        </div>
      </main>
    );
  }

  // Dialog Content

  const dialogConfig = {
    block: {
      title: "Block Team Member",
      description: `Are you sure you want to block "${confirmState.memberName}"? They will lose access to the platform until unblocked.`,
      buttonText: "Block User",
      icon: <Ban className="w-5 h-5 text-red-500" />,
      buttonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white",
    },

    unblock: {
      title: "Unblock Team Member",
      description: `Are you sure you want to unblock "${confirmState.memberName}"? They will regain access to the platform.`,
      buttonText: "Unblock User",
      icon: <Unlock className="w-5 h-5 text-emerald-500" />,
      buttonClass:
        "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600 text-white",
    },

    delete: {
      title: "Delete Team Member",
      description: `Are you sure you want to permanently delete "${confirmState.memberName}"? This action cannot be undone.`,
      buttonText: "Delete User",
      icon: <Trash2 className="w-5 h-5 text-red-500" />,
      buttonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white",
    },
  };

  const currentDialog =
    confirmState.action && dialogConfig[confirmState.action];

  return (
    <main className="min-h-screen bg-background">
      <AdminNavbar />

      {/* Confirm Dialog */}
      <AlertDialog
        open={confirmState.open}
        onOpenChange={(open: unknown) => {
          if (!open) closeConfirmDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {currentDialog?.icon}
              {currentDialog?.title}
            </AlertDialogTitle>

            <AlertDialogDescription className="leading-relaxed">
              {currentDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleConfirmAction}
              className={currentDialog?.buttonClass}
            >
              {currentDialog?.buttonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="px-6 py-8 max-w-7xl mx-auto">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Total Team Members",
              value: summary.totalTeamMembers,
              sub: "Across all roles",
              icon: Users,
              iconColor: "text-primary",
            },
            {
              title: "Managers",
              value: summary.managers,
              sub: "Team leaders",
              icon: UserPlus,
              iconColor: "text-emerald-500",
            },
            {
              title: "Sales Reps",
              value: summary.salesReps,
              sub: "Individual contributors",
              icon: TrendingUp,
              iconColor: "text-blue-500",
            },
          ].map(({ title, value, sub, icon: Icon, iconColor }) => (
            <Card
              key={title}
              className="bg-gradient-to-br from-card to-card/50 border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>

                <Icon className={`w-4 h-4 ${iconColor}`} />
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold">{value}</div>

                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Table */}
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
                onClick={() => fetchTeamData(true)}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => route.push("/admin/assign-team")}
                className="gap-2 bg-black text-white hover:bg-black/90 hover:text-white transition-all shadow-sm hover:shadow"
              >
                Assign team
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
                  Get started by adding your first team member.
                </p>

                <CreateTeamMemberDialog onSuccess={handleMemberCreated} />
              </div>
            ) : (
              <TeamTable
                teamMembers={teamMembers}
                onDeleteMember={(id, name) =>
                  openConfirmDialog("delete", id, name)
                }
                onBlockUser={(id, name) => openConfirmDialog("block", id, name)}
                onUnblockUser={(id, name) =>
                  openConfirmDialog("unblock", id, name)
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
