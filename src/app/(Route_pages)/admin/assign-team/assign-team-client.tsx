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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamManagementHeader } from "@/components/admin/addTeamMember_admin/team-management-header";
import { Users, AlertCircle, CheckCircle2, UserMinus } from "lucide-react";
import { Manager, Rep } from "@/types/admin/assign_team";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export function AssignTeamClient() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await axios.get("/api/admin/assignTeam");
      if (data.success) {
        setManagers(data.managers);
        setReps(data.reps);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to load data",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (repId: string, managerId: string | null) => {
    setSaving(repId);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await axios.patch("/api/admin/assignTeam", {
        repId,
        managerId: managerId === "unassigned" ? null : managerId,
      });

      if (!data.success) throw new Error(data.error);

      // Optimistic update
      setReps((prev) =>
        prev.map((r) =>
          r.id === repId
            ? {
                ...r,
                manager_id: managerId === "unassigned" ? null : managerId,
              }
            : r,
        ),
      );

      const rep = reps.find((r) => r.id === repId);
      const manager = managers.find((m) => m.id === managerId);
      setSuccess(
        managerId && managerId !== "unassigned"
          ? `${rep?.name} assigned to ${manager?.name}`
          : `${rep?.name} unassigned`,
      );

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to update assignment",
      );
    } finally {
      setSaving(null);
    }
  };

  // Group reps by manager for the overview panel
  const repsByManager = managers.map((mgr) => ({
    manager: mgr,
    reps: reps.filter((r) => r.manager_id === mgr.id),
  }));

  const unassignedReps = reps.filter((r) => !r.manager_id);

  return (
    <main className="min-h-screen bg-background">
      <TeamManagementHeader />

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertDescription className="text-emerald-600">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Assign reps to managers */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Assign Sales Reps</CardTitle>
                <CardDescription>
                  Select a manager for each sales rep. Changes save immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : reps.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium">No sales reps yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create sales reps first from the Team Management page.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reps.map((rep) => {
                      const currentManager = managers.find(
                        (m) => m.id === rep.manager_id,
                      );
                      const isSaving = saving === rep.id;

                      return (
                        <div
                          key={rep.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                        >
                          {/* Rep info */}
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                              {getInitials(rep.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {rep.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {rep.email}
                            </p>
                          </div>

                          {/* Status badge */}
                          {!rep.is_active && (
                            <Badge className="bg-red-500/10 text-red-500 flex-shrink-0">
                              Blocked
                            </Badge>
                          )}

                          {/* Manager selector */}
                          <div className="w-52 flex-shrink-0">
                            <Select
                              value={rep.manager_id ?? "unassigned"}
                              onValueChange={(val) => handleAssign(rep.id, val)}
                              disabled={isSaving || !rep.is_active}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Assign manager..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <UserMinus className="w-3.5 h-3.5" />
                                    Unassigned
                                  </span>
                                </SelectItem>
                                {managers.map((mgr) => (
                                  <SelectItem key={mgr.id} value={mgr.id}>
                                    {mgr.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Saving indicator */}
                          {isSaving && (
                            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Team overview panel */}
          <div className="space-y-4">
            {/* Unassigned reps warning */}
            {unassignedReps.length > 0 && (
              <Card className="bg-amber-500/5 border-amber-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Unassigned ({unassignedReps.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unassignedReps.map((rep) => (
                    <div key={rep.id} className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-amber-500/20 text-amber-600 text-xs">
                          {getInitials(rep.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground">
                        {rep.name}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Per-manager team card */}
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : managers.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No managers yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              repsByManager.map(({ manager, reps: teamReps }) => (
                <Card key={manager.id} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-600 text-xs font-semibold">
                          {getInitials(manager.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm">
                          {manager.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {teamReps.length} rep
                          {teamReps.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {teamReps.length > 0 && (
                    <CardContent className="pt-0 space-y-2">
                      {teamReps.map((rep) => (
                        <div key={rep.id} className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {getInitials(rep.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-foreground">
                            {rep.name}
                          </span>
                          {!rep.is_active && (
                            <Badge className="bg-red-500/10 text-red-500 text-xs ml-auto">
                              Blocked
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
