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

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const HARD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB safety cap to avoid OOM
const MAX_DIMENSION = 1600;
const TARGET_BYTES = 1.5 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas encode failed")),
      type,
      quality,
    );
  });
}

async function resizeImage(file: File): Promise<{ blob: Blob; type: string }> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const fitsDimensions = scale === 1;
  const fitsBytes = file.size <= TARGET_BYTES;
  if (fitsDimensions && fitsBytes) return { blob: file, type: file.type };

  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);

  let outType = file.type === "image/webp" ? "image/webp" : "image/jpeg";
  if (file.type === "image/png") outType = "image/png";

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, outType, quality);
  while (blob.size > TARGET_BYTES && quality > 0.5) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, outType, quality);
  }
  // PNG ignores quality — fall back to JPEG if still too large.
  if (blob.size > TARGET_BYTES && outType === "image/png") {
    blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
    outType = "image/jpeg";
  }
  return { blob, type: outType };
}

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
      setError("Only JPG, PNG, or WebP files are allowed.");
      return;
    }
    if (file.size > HARD_MAX_BYTES) {
      setError("File must be smaller than 10 MB.");
      return;
    }

    setUploading(true);

    let blob: Blob;
    let contentType: string;
    try {
      const resized = await resizeImage(file);
      blob = resized.blob;
      contentType = resized.type;
    } catch {
      setError("Failed to process image.");
      setUploading(false);
      return;
    }

    const extByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = extByType[contentType] ?? "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { upsert: false, contentType });

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
            unoptimized
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
                JPG, PNG, WebP · auto-resized
              </p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        id={`image-upload-input-${folder}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
