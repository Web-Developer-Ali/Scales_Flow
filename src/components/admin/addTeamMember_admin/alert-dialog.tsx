"use client";

import { useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { ShieldAlert, Trash2, UserCheck, UserX, Loader2 } from "lucide-react";

interface UserActionDialogProps {
  userId: string;
  userName: string;
  action: "block" | "unblock" | "delete";
  onSuccess?: () => void;
}

export function UserActionDialog({
  userId,
  userName,
  action,
  onSuccess,
}: UserActionDialogProps) {
  const [loading, setLoading] = useState(false);

  const isDelete = action === "delete";
  const isBlock = action === "block";
  const isUnblock = action === "unblock";

  const config = {
    block: {
      title: "Block User",
      description:
        "This user will lose access to the platform until unblocked.",
      button: "Block User",
      icon: UserX,
      variant: "bg-amber-500 hover:bg-amber-600 text-white",
    },

    unblock: {
      title: "Unblock User",
      description: "This user will regain access to the platform.",
      button: "Unblock User",
      icon: UserCheck,
      variant: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },

    delete: {
      title: "Delete User",
      description:
        "This action permanently deletes the user and cannot be undone.",
      button: "Delete User",
      icon: Trash2,
      variant: "bg-red-600 hover:bg-red-700 text-white",
    },
  };

  const current = config[action];
  const Icon = current.icon;

  const handleAction = async () => {
    try {
      setLoading(true);

      if (isBlock) {
        await axios.patch(`/api/users/${userId}/block`);
      }

      if (isUnblock) {
        await axios.patch(`/api/users/${userId}/unblock`);
      }

      if (isDelete) {
        await axios.delete(`/api/users/${userId}`);
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={isDelete ? "destructive" : "outline"}
          size="sm"
          className={
            isBlock
              ? "border-amber-300 text-amber-600 hover:bg-amber-50"
              : isUnblock
                ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                : ""
          }
        >
          <Icon className="w-4 h-4 mr-2" />

          {isBlock && "Block"}
          {isUnblock && "Unblock"}
          {isDelete && "Delete"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                isDelete
                  ? "bg-red-100"
                  : isBlock
                    ? "bg-amber-100"
                    : "bg-emerald-100"
              }`}
            >
              <ShieldAlert
                className={`w-5 h-5 ${
                  isDelete
                    ? "text-red-600"
                    : isBlock
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              />
            </div>

            <div>
              <AlertDialogTitle>{current.title}</AlertDialogTitle>

              <p className="text-sm text-muted-foreground mt-1">{userName}</p>
            </div>
          </div>

          <AlertDialogDescription className="pt-3">
            {current.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleAction}
            disabled={loading}
            className={current.variant}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icon className="w-4 h-4 mr-2" />
                {current.button}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
