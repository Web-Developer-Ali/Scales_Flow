"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserPlus, TrendingUp } from "lucide-react";
import { TeamManagementHeader } from "@/components/addTeamMember_admin/team-management-header";
import { CreateTeamMemberDialog } from "@/components/addTeamMember_admin/create-team-member-dialog";
import { TeamTable } from "@/components/addTeamMember_admin/team-table";

export function TeamManagementPageClient() {
  const [teamMembers, setTeamMembers] = useState([
    {
      id: "1",
      name: "John Manager",
      email: "john@company.com",
      role: "Manager",
      status: "active",
      joinDate: "2024-01-15",
    },
    {
      id: "2",
      name: "Sarah Sales",
      email: "sarah@company.com",
      role: "Sales Rep",
      status: "active",
      joinDate: "2024-02-01",
    },
    {
      id: "3",
      name: "Mike Sales",
      email: "mike@company.com",
      role: "Sales Rep",
      status: "active",
      joinDate: "2024-02-15",
    },
  ]);

  const handleAddMember = (data: any) => {
    const newMember = {
      id: (teamMembers.length + 1).toString(),
      ...data,
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
    };
    setTeamMembers([...teamMembers, newMember]);
  };

  const handleDeleteMember = (id: string) => {
    setTeamMembers(teamMembers.filter((member) => member.id !== id));
  };

  const managers = teamMembers.filter((m) => m.role === "Manager");
  const salesReps = teamMembers.filter((m) => m.role === "Sales Rep");

  return (
    <main className="min-h-screen bg-background">
      <TeamManagementHeader />

      <div className="px-6 py-8">
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
              <div className="text-2xl font-bold">{teamMembers.length}</div>
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
              <div className="text-2xl font-bold">{managers.length}</div>
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
              <div className="text-2xl font-bold">{salesReps.length}</div>
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
            <TeamTable
              teamMembers={teamMembers}
              onDeleteMember={handleDeleteMember}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
