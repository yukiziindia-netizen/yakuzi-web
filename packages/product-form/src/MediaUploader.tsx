"use client";
import React, { useRef } from "react";
import { Plus, X, UploadCloud, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "./lib/utils";

export type MediaItem = {
  id: string;
  url: string;
  isLoading?: boolean;
};

interface MediaUploaderProps {
  items: MediaItem[];
  onChange: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  onUpload: (file: File) => Promise<string>;
}

// Multi-image upload grid feeding ProductForm's `image_list` field. The
// product detail page's gallery (thumbnail rail + main image) already
// supports any number of images — sellers/admin just never had a way to
// attach more than the single image a suggestion prefilled, since the
// seller app's own ProductForm had no upload control at all (the admin-only
// MediaUploader this is adapted from was dropped when the add/edit forms
// were unified onto one shared component for admin+seller parity).
export function MediaUploader({ items, onChange, onUpload }: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const pending = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      isLoading: true,
    }));

    onChange([...items, ...pending]);

    const results = await Promise.all(
      files.map(async (file, index) => {
        try {
          const url = await onUpload(file);
          return { ...pending[index], url, isLoading: false };
        } catch {
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      }),
    );

    onChange((current) =>
      current
        .map((item) => {
          const uploadedIndex = pending.findIndex((p) => p.id === item.id);
          if (uploadedIndex === -1) return item;
          return results[uploadedIndex] ?? null;
        })
        .filter((item): item is MediaItem => item !== null)
    );

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(Array.from(e.target.files || []));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
  };

  return (
    <div className="space-y-4" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*"
      />

      {items.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-accent/5 transition-colors cursor-pointer group min-h-[200px]"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Add product images</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drop images here or click to browse. First image is the main product photo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border bg-muted/30 group",
                index === 0 ? "border-primary ring-1 ring-primary" : "border-border",
              )}
            >
              {item.isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="Product" className="w-full h-full object-contain" />
              )}
              {index === 0 && !item.isLoading && (
                <span className="absolute bottom-1 left-1 text-2xs font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}
              {!item.isLoading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  className="absolute top-1 right-1 h-6 w-6 rounded-lg bg-background/80 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-background opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/5 transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
