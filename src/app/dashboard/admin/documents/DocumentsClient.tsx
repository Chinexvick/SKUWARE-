"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Doc {
  id: string;
  title: string;
  fileName: string;
  category: string;
  size: number;
  createdAt: string;
}

const CATEGORIES = ["STUDENT", "STAFF", "ADMISSION", "ACADEMIC", "CERTIFICATE", "POLICY", "OTHER"];

export function DocumentsClient() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("POLICY");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/documents?ownerType=school");
    const data = await res.json();
    if (res.ok) setDocuments(data.documents);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    form.append("category", category);
    form.append("ownerType", "school");
    const res = await fetch("/api/documents", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Could not upload document.");
    else {
      setTitle("");
      setFile(null);
      load();
    }
    setUploading(false);
  }

  return (
    <div>
      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Upload Document</h3>
        <form onSubmit={upload} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            File (PDF, Word, PNG, JPEG — max 10MB)
            <input type="file" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <div className="sm:col-span-3">
            <Button type="submit" loading={uploading}>
              Upload
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No documents yet.</td>
              </tr>
            ) : (
              documents.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-black">{d.title}</td>
                  <td className="px-4 py-3">{d.category}</td>
                  <td className="px-4 py-3">{Math.round(d.size / 1024)} KB</td>
                  <td className="px-4 py-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <a href={`/api/documents/${d.id}/download`} className="text-xs font-semibold text-black underline">
                      Download
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
