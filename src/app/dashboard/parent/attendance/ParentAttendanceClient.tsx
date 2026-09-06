"use client";

import { useState } from "react";
import { AttendanceHistory } from "@/components/academics/AttendanceHistory";

export function ParentAttendanceClient({ kids }: { kids: { id: string; name: string }[] }) {
  const [studentId, setStudentId] = useState(kids[0].id);

  return (
    <div>
      {kids.length > 1 && (
        <div className="mb-4">
          <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium text-black">
            Child
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              {kids.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <AttendanceHistory studentId={studentId} />
    </div>
  );
}
