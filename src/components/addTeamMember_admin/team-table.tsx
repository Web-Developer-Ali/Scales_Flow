"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, MoreHorizontal, Ban, Unlock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string; // "Manager" | "Sales Rep"
  status: string; // "active" | "blocked"
  joinDate: string;
}

interface TeamTableProps {
  teamMembers: TeamMember[];
  onDeleteMember: (id: string) => void;
  onBlockUser: (id: string) => void;
  onUnblockUser: (id: string) => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const getRoleStyle = (role: string) =>
  role === "Manager"
    ? "bg-emerald-500/10 text-emerald-700"
    : "bg-blue-500/10 text-blue-700";

const getStatusStyle = (status: string) =>
  status === "active"
    ? "bg-emerald-500/10 text-emerald-700"
    : "bg-red-500/10 text-red-700";

export function TeamTable({
  teamMembers,
  onDeleteMember,
  onBlockUser,
  onUnblockUser,
}: TeamTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          {["Member", "Email", "Role", "Status", "Join Date", "Actions"].map(
            (h, i) => (
              <TableHead
                key={h}
                className={`text-foreground font-semibold ${i === 5 ? "text-right" : ""}`}
              >
                {h}
              </TableHead>
            ),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {teamMembers.map((member) => (
          <TableRow key={member.id} className="border-border hover:bg-muted/50">
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {member.name}
                </span>
              </div>
            </TableCell>

            <TableCell className="text-muted-foreground">
              {member.email}
            </TableCell>

            <TableCell>
              <Badge className={getRoleStyle(member.role)}>{member.role}</Badge>
            </TableCell>

            <TableCell>
              {/* ✅ Status badge now correctly reflects active vs blocked */}
              <Badge className={getStatusStyle(member.status)}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </Badge>
            </TableCell>

            <TableCell className="text-muted-foreground text-sm">
              {new Date(member.joinDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </TableCell>

            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* ✅ Show Block only if currently active */}
                  {member.status === "active" && (
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive"
                      onClick={() => onBlockUser(member.id)}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  )}

                  {/* ✅ Show Unblock only if currently blocked */}
                  {member.status === "blocked" && (
                    <DropdownMenuItem
                      className="cursor-pointer text-emerald-600"
                      onClick={() => onUnblockUser(member.id)}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Unblock User
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={() => onDeleteMember(member.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
