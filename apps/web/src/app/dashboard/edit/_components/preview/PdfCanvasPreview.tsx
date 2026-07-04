"use client";

import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  AnnotationMode,
  GlobalWorkerOptions,
  RenderingCancelledException,
  getDocument,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { prepareResumePdfExport } from "@/lib/utils/pdf-export";
import { cn } from "@/lib/utils";
import type { Resume } from "@/types/frontend/resume";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type PdfCanvasPreviewProps = {
  className?: string;
  locale?: string;
  resume: Resume;
};

type PdfPreviewState =
  | { status: "loading"; blob: null; error: null }
  | { status: "ready"; blob: Blob; error: null }
  | { status: "error"; blob: null; error: unknown };

type PdfPageSize = {
  height: number;
  width: number;
};

const CSS_PX_PER_PDF_POINT = 96 / 72;
const MAX_DEVICE_PIXEL_RATIO = 2;
const UPDATE_DEBOUNCE_MS = 150;

const isRenderingCancelledError = (error: unknown) =>
  error instanceof RenderingCancelledException ||
  (typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "RenderingCancelledException");

function PdfPreviewLoader() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-[1123px] w-[794px] rounded-lg bg-neutral-950 shadow-2xl shadow-black/50">
        <div className="h-full w-full animate-pulse rounded-lg border border-white/5 bg-white/[0.04]" />
      </div>
    </div>
  );
}

function PdfPreviewError() {
  return (
    <div className="flex h-[420px] w-[640px] items-center justify-center rounded-lg border border-red-500/30 bg-red-950/20 px-8 text-center text-sm text-red-100 shadow-2xl shadow-black/40">
      PDF 预览生成失败，请稍后重试；导出按钮会显示更具体的错误。
    </div>
  );
}

function PdfCanvasDocument({
  children,
  file,
  onLoadSuccess,
}: {
  children: (document: PDFDocumentProxy) => ReactNode;
  file: Blob;
  onLoadSuccess: (document: PDFDocumentProxy) => void;
}) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const onLoadSuccessRef = useRef(onLoadSuccess);

  useEffect(() => {
    onLoadSuccessRef.current = onLoadSuccess;
  }, [onLoadSuccess]);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let loadedDocument: PDFDocumentProxy | undefined;

    const loadDocument = async () => {
      setDocument(null);
      const arrayBuffer = await file.arrayBuffer();
      if (cancelled) return;

      loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDocument = await loadingTask.promise;

      if (cancelled) {
        pdfDocument.cleanup();
        return;
      }

      loadedDocument = pdfDocument;
      setDocument(pdfDocument);
      onLoadSuccessRef.current(pdfDocument);
    };

    void loadDocument().catch((error: unknown) => {
      if (!cancelled) console.error("Failed to load PDF preview document", error);
    });

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
      loadedDocument?.cleanup();
    };
  }, [file]);

  if (!document) return <PdfPreviewLoader />;
  return children(document);
}

function PdfCanvasPage({
  document,
  pageNumber,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageSize, setPageSize] = useState<PdfPageSize | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: RenderTask | undefined;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const page = await document.getPage(pageNumber);

      try {
        if (cancelled) {
          page.cleanup();
          return;
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const cssWidth = baseViewport.width * CSS_PX_PER_PDF_POINT;
        const cssHeight = baseViewport.height * CSS_PX_PER_PDF_POINT;
        const deviceScale = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
        const canvasContext = canvas.getContext("2d");

        if (!canvasContext) return;

        setPageSize({ width: cssWidth, height: cssHeight });
        canvas.width = Math.floor(cssWidth * deviceScale);
        canvas.height = Math.floor(cssHeight * deviceScale);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        canvasContext.setTransform(1, 0, 0, 1, 0, 0);
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        const viewport = page.getViewport({ scale: CSS_PX_PER_PDF_POINT });
        renderTask = page.render({
          annotationMode: AnnotationMode.DISABLE,
          background: "white",
          canvas,
          canvasContext,
          transform: [deviceScale, 0, 0, deviceScale, 0, 0],
          viewport,
        });

        await renderTask.promise;
        renderTask = undefined;
      } finally {
        page.cleanup();
      }
    };

    void renderPage().catch((error: unknown) => {
      if (isRenderingCancelledError(error)) return;
      console.error(`Failed to render PDF preview page ${pageNumber}`, error);
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber]);

  return (
    <figure
      className="shrink-0 overflow-hidden rounded-lg bg-white shadow-2xl shadow-black/50"
      style={pageSize ?? { width: 794, height: 1123 }}
    >
      <canvas ref={canvasRef} aria-label={`Resume PDF page ${pageNumber}`} />
    </figure>
  );
}

export function PdfCanvasPreview({ className, locale, resume }: PdfCanvasPreviewProps) {
  const [state, setState] = useState<PdfPreviewState>({
    status: "loading",
    blob: null,
    error: null,
  });
  const [pageCount, setPageCount] = useState(0);
  const lastReadyBlobRef = useRef<Blob | null>(null);
  const hasPreviewRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const delay = hasPreviewRef.current ? UPDATE_DEBOUNCE_MS : 0;

    setState((current) => {
      if (current.status === "ready") return current;
      return { status: "loading", blob: null, error: null };
    });

    const timeoutId = window.setTimeout(() => {
      void prepareResumePdfExport(resume, locale)
        .then((blob) => {
          if (cancelled) return;
          hasPreviewRef.current = true;
          lastReadyBlobRef.current = blob;
          setState({ status: "ready", blob, error: null });
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          console.error("Failed to generate PDF preview", error);
          setState({ status: "error", blob: null, error });
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [resume, locale]);

  const visibleBlob = state.status === "ready" ? state.blob : lastReadyBlobRef.current;
  const pageNumbers = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount],
  );

  if (state.status === "error" && !visibleBlob) {
    return <PdfPreviewError />;
  }

  if (!visibleBlob) {
    return <PdfPreviewLoader />;
  }

  return (
    <div className={cn("relative", className)}>
      <PdfCanvasDocument file={visibleBlob} onLoadSuccess={(document) => setPageCount(document.numPages)}>
        {(document) => (
          <div className="flex flex-col items-center gap-6">
            {pageNumbers.map((pageNumber) => (
              <PdfCanvasPage key={`${visibleBlob.size}-${pageNumber}`} document={document} pageNumber={pageNumber} />
            ))}
          </div>
        )}
      </PdfCanvasDocument>
      {state.status === "loading" && lastReadyBlobRef.current ? (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/10 bg-neutral-950/70 px-3 py-1 text-xs text-neutral-200 shadow-lg backdrop-blur">
          正在更新 PDF 预览...
        </div>
      ) : null}
    </div>
  );
}
