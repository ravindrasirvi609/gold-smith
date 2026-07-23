"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileIcon, ImageIcon, Paperclip, X } from "lucide-react";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_MIMES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml"];
const DOC_MIMES = [...IMAGE_MIMES, "application/pdf"];

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function safeSrc(url: string): string {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : "";
  } catch {
    return "";
  }
}

type FileUploadProps = {
  kind: string;
  variant: "image" | "document";
  name: string;
  label: string;
  initialUrl?: string;
  initialName?: string;
  className?: string;
};

export function FileUpload({ kind, variant, name, label, initialUrl, initialName, className }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [fileName, setFileName] = useState(initialName ?? (initialUrl ? "Current file" : ""));
  const [fileSize, setFileSize] = useState("");
  const [uploading, setUploading] = useState(false);

  const allowed = variant === "image" ? IMAGE_MIMES : DOC_MIMES;

  async function upload(file: File) {
    if (!allowed.includes(file.type)) {
      toast.error(
        variant === "image"
          ? `"${file.type}" is not allowed. Use JPG, PNG, WEBP, GIF or SVG.`
          : `"${file.type}" is not allowed. Use JPG, PNG, WEBP, GIF, SVG or PDF.`
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File exceeds the 10 MB limit.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Upload failed.");
      setUrl(data.file.url);
      setFileName(file.name);
      setFileSize(fmtBytes(file.size));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  }

  function remove() {
    setUrl("");
    setFileName("");
    setFileSize("");
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <input type="hidden" name={name} value={url} />
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={allowed.join(",")}
        onChange={handleChange}
      />

      {url || uploading ? (
        <Attachment state={uploading ? "uploading" : "done"} orientation="horizontal" className="w-full">
          <AttachmentMedia>
            {uploading ? (
              <Spinner className="size-4" />
            ) : variant === "image" && url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeSrc(url)} alt={fileName} className="size-full object-cover" />
            ) : (
              <FileIcon className="size-4" />
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{uploading ? "Uploading…" : fileName}</AttachmentTitle>
            {fileSize && !uploading ? <AttachmentDescription>{fileSize}</AttachmentDescription> : null}
          </AttachmentContent>
          {!uploading && (
            <AttachmentActions>
              <AttachmentAction aria-label="Remove" onClick={remove}>
                <X className="size-3" />
              </AttachmentAction>
            </AttachmentActions>
          )}
        </Attachment>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          {variant === "image" ? (
            <ImageIcon className="size-4 shrink-0" />
          ) : (
            <Paperclip className="size-4 shrink-0" />
          )}
          <span>
            {variant === "image" ? "Upload image" : "Attach document"}
            <span className="ml-1 text-xs opacity-60">
              ({variant === "image" ? "JPG · PNG · WEBP · SVG" : "JPG · PNG · PDF"}, max 10 MB)
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
