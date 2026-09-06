"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const MAX_FILE_BYTES = 500 * 1024;

export function ProfileClient({
  firstName,
  lastName,
  email,
  phone,
  roleLabel,
  avatarUrl: initialAvatarUrl,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleLabel: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile() {
    fileInputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please choose a PNG, JPEG, or WEBP image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image is too large — please choose one under 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploading(true);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      setUploading(false);
      if (!res.ok) {
        setError(data.error ?? "Could not upload photo.");
        return;
      }
      setAvatarUrl(data.avatarUrl);
      router.refresh();
    };
    reader.readAsDataURL(file);
  }

  async function removePhoto() {
    setUploading(true);
    await fetch("/api/profile/avatar", { method: "DELETE" });
    setUploading(false);
    setAvatarUrl(null);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data: URI avatar
              <img src={avatarUrl} alt={`${firstName} ${lastName}`} className="h-28 w-28 rounded-full object-cover" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-yellow text-3xl font-bold text-black">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />

          <div className="flex gap-2">
            <Button variant="secondary" onClick={pickFile} loading={uploading}>
              {avatarUrl ? "Change photo" : "Upload photo"}
            </Button>
            {avatarUrl && (
              <Button variant="ghost" onClick={removePhoto} disabled={uploading}>
                Remove
              </Button>
            )}
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <p className="text-xs text-gray-500">PNG, JPEG, or WEBP, up to 500KB.</p>
        </div>

        <div className="mt-8 space-y-4 border-t border-gray-100 pt-6 text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</p>
            <p className="text-sm font-medium text-black">
              {firstName} {lastName}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
            <p className="text-sm font-medium text-black">{email}</p>
          </div>
          {phone && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
              <p className="text-sm font-medium text-black">{phone}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</p>
            <p className="text-sm font-medium text-black">{roleLabel}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
