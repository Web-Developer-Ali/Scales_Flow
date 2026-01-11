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
import { Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
}

interface TeamTableProps {
  teamMembers: TeamMember[];
  onDeleteMember: (id: string) => void;
}

export function TeamTable({ teamMembers, onDeleteMember }: TeamTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleColor = (role: string) => {
    return role === "Manager"
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-blue-500/10 text-blue-700";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-foreground font-semibold">
            Member
          </TableHead>
          <TableHead className="text-foreground font-semibold">Email</TableHead>
          <TableHead className="text-foreground font-semibold">Role</TableHead>
          <TableHead className="text-foreground font-semibold">
            Status
          </TableHead>
          <TableHead className="text-foreground font-semibold">
            Join Date
          </TableHead>
          <TableHead className="text-foreground font-semibold text-right">
            Actions
          </TableHead>
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
              <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-700"
              >
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {member.joinDate}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 hover:bg-black/10 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
