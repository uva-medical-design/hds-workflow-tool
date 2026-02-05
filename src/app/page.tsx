export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <main className="flex max-w-md flex-col items-center gap-8 text-center">
        {/* MDP Logo */}
        <div className="text-4xl font-bold tracking-tight">
          &lt;mdp&gt;
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            HDS Workflow Tool
          </h1>
          <p className="text-muted-foreground">
            Guided PRD generation for healthcare design sprints
          </p>
        </div>

        {/* Setup verification */}
        <div className="mt-8 w-full rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-medium">Setup Status</h2>
          <ul className="space-y-2 text-left text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span>
              <span>Next.js 16 + App Router</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span>
              <span>Tailwind CSS v4</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span>
              <span>shadcn/ui initialized</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span>
              <span>MDP design tokens applied</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">&#10003;</span>
              <span>JetBrains Mono font</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-600">&#9675;</span>
              <span>Supabase connection (needs .env.local)</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Next: Add Supabase keys to .env.local, then run schema
        </p>
      </main>
    </div>
  );
}
