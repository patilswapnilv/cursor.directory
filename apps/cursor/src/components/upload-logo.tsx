"use client";

import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface UploadLogoProps {
  onUpload?: (url: string) => void;
  prefix: string;
  image?: string | null;
}

export default function UploadLogo({
  onUpload,
  prefix,
  image,
}: UploadLogoProps) {
  const [preview, setPreview] = useState<string | null>(image ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(`${prefix}/${fileName}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(`${prefix}/${fileName}`);

      onUpload?.(publicUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  // preventDefault is required for the drop event to fire.
  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInput}
        accept="image/*"
      />

      <button
        type="button"
        aria-label="Upload logo"
        className={`relative block w-[80px] h-[80px] border border-border 
           transition-colors duration-200 cursor-pointer`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        style={{
          backgroundImage: `repeating-linear-gradient(
            -60deg,
            transparent,
            transparent 1px,
            #2C2C2C 1px,
            #2C2C2C 2px,
            transparent 2px,
            transparent 6px
          )`,
        }}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Logo preview"
            fill
            className="object-cover rounded-lg"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-primary">
            <PlusIcon className="size-4" />
          </div>
        )}
      </button>
    </>
  );
}
