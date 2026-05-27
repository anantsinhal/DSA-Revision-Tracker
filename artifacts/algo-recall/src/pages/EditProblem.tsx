import { Layout } from "@/components/layout/Layout";
import { ProblemForm } from "@/components/problems/ProblemForm";
import { useProblems } from "@/hooks/useProblems";
import { useParams, Redirect } from "wouter";

export default function EditProblem() {
  const { id } = useParams<{ id: string }>();
  const { problems } = useProblems();
  
  const problem = problems.find(p => p.id === id);

  if (!problem && problems.length > 0) {
    return <Redirect to="/problems" />;
  }

  if (!problem) return null; // loading state essentially

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Problem</h1>
          <p className="text-muted-foreground">Update details for {problem.name}.</p>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <ProblemForm initialData={problem} isEdit={true} />
        </div>
      </div>
    </Layout>
  );
}
