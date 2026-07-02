"use client";
import React, { useState, useRef, useCallback } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X, UploadCloud, Loader2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { uploadProductMedia } from "@/api/admin.api";

export type MediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  isLoading?: boolean;
};

interface MediaUploaderProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

// Sub-component for individual sortable item
function SortableMediaItem({ item, onRemove }: { item: MediaItem; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative rounded-xl overflow-hidden border border-border bg-muted/30 group cursor-grab active:cursor-grabbing",
        "w-full h-full flex items-center justify-center",
        isDragging && "opacity-50 shadow-xl ring-2 ring-primary"
      )}
    >
      {item.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : item.type === "video" ? (
        <div className="w-full h-full relative bg-black/5">
          <video src={item.url} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Video className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt="Media" className="w-full h-full object-contain" draggable={false} />
      )}
      
      {!item.isLoading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-background/80 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-background opacity-0 group-hover:opacity-100 transition-all z-20"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function MediaUploader({ items, onChange }: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      
      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      
      onChange(newItems);
    }
  };

  const handleRemove = useCallback((id: string) => {
    onChange(items.filter(item => item.id !== id));
  }, [items, onChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Create temporary items for optimistic UI loading
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file), // Temp preview
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
      isLoading: true
    }));

    onChange([...items, ...newItems]);

    // Upload files
    const uploadedItems = await Promise.all(
      files.map(async (file, index) => {
        try {
          const url = await uploadProductMedia(file);
          return { ...newItems[index], url, isLoading: false };
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      })
    );

    // Filter out failed uploads and update the state
    const allItems = [...items, ...newItems];
    const updated = allItems.map(item => {
      const uploaded = uploadedItems.find(u => u?.id === item.id);
      return uploaded ? uploaded : item;
    }).filter(item => !item.isLoading || newItems.find(n => n.id === item.id)); 
    
    // We also need to remove failed uploads
    const failedIds = newItems.filter((_, i) => !uploadedItems[i]).map(n => n.id);
    onChange(updated.filter(item => !failedIds.includes(item.id)));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOverArea = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropArea = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (files.length === 0) return;

    // Simulate input change event
    const dataTransfer = new DataTransfer();
    files.forEach(f => dataTransfer.items.add(f));
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
      handleFileChange({ target: fileInputRef.current } as any);
    }
  };

  return (
    <div 
      className="space-y-4"
      onDragOver={handleDragOverArea}
      onDrop={handleDropArea}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,video/*"
      />

      {items.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-accent/5 transition-colors cursor-pointer group min-h-[300px]"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Add files</p>
          <p className="text-xs text-muted-foreground mt-1">Accepts images, videos, or 3D models</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* Shopify layout: First item spans 2 cols/2 rows if multiple items. Using a custom grid CSS. */}
          <SortableContext
            items={items.map(i => i.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 auto-rows-[120px] md:auto-rows-[160px]">
              
              {items.map((item, index) => {
                return (
                  <div key={item.id} className="col-span-1 row-span-1 h-full">
                    <SortableMediaItem item={item} onRemove={handleRemove} />
                  </div>
                );
              })}
              
              {/* Add more button at the end */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="col-span-1 row-span-1 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/5 transition-colors h-full w-full"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
