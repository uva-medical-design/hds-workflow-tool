"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/user-context";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";

const PHASE_LABELS: Record<number, string> = {
  1: "Problem Discovery",
  2: "User Deep-Dive",
  3: "Jobs to Be Done",
  4: "Journey & Opportunities",
  5: "Features & Priorities",
  6: "Technical Spec",
  7: "Build Brief",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  // Redirect to home if no user selected
  useEffect(() => {
    if (!user) {
      // Wait a tick for localStorage hydration
      const timeout = setTimeout(() => {
        const stored = localStorage.getItem("hds-user");
        if (!stored) router.push("/");
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [user, router]);

  // Fetch user's projects
  useEffect(() => {
    if (!user) return;

    async function fetchProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    }

    fetchProjects();
  }, [user]);

  async function handleCreateProject() {
    if (!user || !newProjectName.trim()) return;

    setCreating(true);

    const slug = newProjectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: newProjectName.trim(),
        slug,
        current_phase: 1,
        current_step: "input",
        status: "active",
      })
      .select()
      .single();

    setCreating(false);

    if (error) {
      alert("Failed to create project. Try a different name.");
      return;
    }

    setDialogOpen(false);
    setNewProjectName("");
    router.push(`/dashboard/${data.id}`);
  }

  function handleSignOut() {
    setUser(null);
    router.push("/");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold tracking-tight">
              &lt;mdp&gt;
            </span>
            <span className="text-sm text-muted-foreground">
              {user.name}
              {user.role !== "student" && ` (${user.role})`}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your Projects</h1>
            <p className="text-sm text-muted-foreground">
              Select a project to continue or start a new one
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="size-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
                <DialogDescription>
                  Give your healthcare design project a working name. You can
                  change this later.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Diabetes Management Tool"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newProjectName.trim()) {
                      handleCreateProject();
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creating}
                >
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Project Cards */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <p className="text-muted-foreground">No projects yet</p>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(true)}
              >
                <PlusIcon className="size-4" />
                Create your first project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => router.push(`/dashboard/${project.id}`)}
              >
                <CardHeader>
                  <CardTitle>{project.name || "Untitled Project"}</CardTitle>
                  <CardDescription>
                    Phase {project.current_phase} of 7 &mdash;{" "}
                    {PHASE_LABELS[project.current_phase] || "Unknown"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Phase progress bar */}
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i + 1 < project.current_phase
                            ? "bg-foreground"
                            : i + 1 === project.current_phase
                              ? "bg-foreground/50"
                              : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{project.status}</span>
                    <span>
                      Updated{" "}
                      {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
