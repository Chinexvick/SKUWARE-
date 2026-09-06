"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Assignment {
  id: string;
  subject: { name: string };
  class: { name: string };
  arm: { name: string } | null;
  term: { name: string; isCurrent: boolean };
}

export function TeacherClassesClient() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch("/api/academics/assignments");
      const data = await res.json();
      if (res.ok) setAssignments(data.assignments);
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <LoadingSpinner size="sm" className="py-10" />;
  if (assignments.length === 0) return <p className="text-sm text-gray-500">You have no class assignments yet.</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {assignments.map((a) => (
        <Card key={a.id}>
          <h3 className="font-semibold text-black">{a.subject.name}</h3>
          <p className="text-sm text-gray-500">
            {a.class.name}
            {a.arm ? ` ${a.arm.name}` : " (all arms)"}
          </p>
          <p className="mb-3 text-xs text-gray-400">
            {a.term.name} {a.term.isCurrent && <span className="font-semibold text-black">· current</span>}
          </p>
          <Link
            href={`/dashboard/teacher/grading?assignmentId=${a.id}`}
            className="inline-block rounded-lg bg-brand-yellow px-3 py-1.5 text-xs font-bold text-black hover:brightness-95"
          >
            Enter scores
          </Link>
        </Card>
      ))}
    </div>
  );
}
