"use client";

import React from "react";
import { FileText, FileImage, File } from "lucide-react";

interface DocumentLike {
  id?: string;
  originalName: string;
  fileType: string;
  filePath?: string | null;
  // allow extra fields like filename via any
  [key: string]: any;
}

interface Props {
  doc: DocumentLike;
  className?: string;
}

function getSrc(doc: DocumentLike): string {
  const anyDoc: any = doc as any;
  const fromPath = (anyDoc.filePath as string | undefined) || "";
  const fromFilename = anyDoc.filename ? `/uploads/${anyDoc.filename}` : "";
  return fromPath || fromFilename || "";
}

export default function DocumentThumbnail({ doc, className }: Props) {
  const src = getSrc(doc);
  const isImage = doc.fileType?.startsWith("image/");
  const isPdf = doc.fileType === "application/pdf";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border bg-muted/30 ${className ?? ""}`}
      // Slightly shorter ratio to fit mobile screens better
      style={{ aspectRatio: "3 / 2" }}
    >
      {/* Badge by type (like Drive) */}
      <div className="absolute top-2 left-2 z-10">
        {isPdf ? (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-red-600 text-white">PDF</span>
        ) : isImage ? (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-emerald-600 text-white">IMG</span>
        ) : null}
      </div>

      {/* Preview area */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/40">
        {isImage && src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={doc.originalName} className="h-full w-full object-cover" loading="lazy" />
        ) : isPdf && src ? (
          // Using object for lightweight inline PDF preview; browsers may render first page snapshot-like
          <object data={src} type="application/pdf" className="h-full w-full">
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <FileText className="h-10 w-10" />
            </div>
          </object>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {doc.fileType?.startsWith("image/") ? (
              <FileImage className="h-10 w-10" />
            ) : (
              <File className="h-10 w-10" />
            )}
          </div>
        )}
      </div>

      {/* gradient overlay for nice look */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
