"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("name");

      if (error) {
        setError("Could not load roster. Check your Supabase connection.");
        setLoading(false);
        return;
      }

      setUsers(data || []);
      setLoading(false);
    }

    fetchUsers();
  }, []);

  // If user is already selected (from localStorage), pre-select them
  useEffect(() => {
    if (user && !selectedId) {
      setSelectedId(user.id);
    }
  }, [user, selectedId]);

  function handleContinue() {
    const selected = users.find((u) => u.id === selectedId);
    if (selected) {
      setUser(selected);
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <main className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        {/* MDP Logo */}
        <div className="text-4xl font-bold tracking-tight">&lt;mdp&gt;</div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            HDS Workflow Tool
          </h1>
          <p className="text-sm text-muted-foreground">
            Guided PRD generation for healthcare design sprints
          </p>
        </div>

        {/* User Selection */}
        <div className="flex w-full flex-col gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading roster...</p>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your name" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                      {u.role !== "student" && (
                        <span className="ml-2 text-muted-foreground">
                          ({u.role})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleContinue}
                disabled={!selectedId}
                className="w-full"
              >
                Continue
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          UVA Medical Design Program
        </p>
      </main>
    </div>
  );
}
