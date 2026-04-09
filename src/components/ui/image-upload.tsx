"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  /** Current image URL (controlled) */
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Supabase Storage bucket name */
  bucket?: string;
  /** Storage folder prefix, e.g. "products" or "store" */
  folder?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Drag-and-drop image uploader backed by Supabase Storage.
 * Uploads to `{bucket}/{folder}/{uuid}.{ext}` and returns the public URL.
 */
export function ImageUpload({
  value,
  onChange,
  label,
  bucket = "pos-assets",
  folder = "images",
}: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, WebP, or GIF files are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be smaller than 2 MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    upload(files[0]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleClear() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={`image-upload-input-${folder}`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      {value ? (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Uploaded image preview"
            width={120}
            height={120}
            className="rounded-lg object-cover border border-gray-200 dark:border-gray-600"
            style={{ width: 120, height: 120 }}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full p-0.5 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Remove image"
          >
            <X
              className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Upload image by clicking or dragging"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            dragging
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"
          }`}
        >
          {uploading ? (
            <Loader2
              className="h-6 w-6 text-blue-500 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <>
              <div className="flex gap-2 text-gray-400 dark:text-gray-500">
                <ImageIcon className="h-6 w-6" aria-hidden="true" />
                <Upload className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Drag & drop or{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  click to upload
                </span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                JPG, PNG, WebP · max 2 MB
              </p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        id={`image-upload-input-${folder}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
