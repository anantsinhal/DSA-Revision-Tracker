import { Layout } from "@/components/layout/Layout";
import { ProblemForm } from "@/components/problems/ProblemForm";

export default function AddProblem() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Add Problem</h1>
          <p className="text-muted-foreground">Log a new problem to your revision tracker.</p>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <ProblemForm />
        </div>
      </div>
    </Layout>
  );
}
