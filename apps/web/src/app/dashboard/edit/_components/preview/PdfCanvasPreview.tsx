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
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  | { status: "idle"; error: null }
  | { status: "loading"; error: null }
  | { status: "error"; error: unknown };

type PdfPreviewLayer = {
  blob: Blob;
  id: number;
  pageCount: number;
  pageSizes: Record<number, PdfPageSize>;
  phase: "active" | "staged" | "exiting";
  renderedPages: number[];
};

type PdfPageSize = {
  height: number;
  width: number;
};

const CSS_PX_PER_PDF_POINT = 96 / 72;
const MAX_DEVICE_PIXEL_RATIO = 2;
const UPDATE_DEBOUNCE_MS = 150;
const CROSSFADE_DURATION_MS = 180;

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

  if (!document) return null;
  return children(document);
}

function PdfCanvasPage({
  document,
  onLoadSuccess,
  onRenderSuccess,
  pageNumber,
  pageSize,
}: {
  document: PDFDocumentProxy;
  onLoadSuccess: (pageNumber: number, pageSize: PdfPageSize) => void;
  onRenderSuccess: (pageNumber: number) => void;
  pageNumber: number;
  pageSize?: PdfPageSize;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onLoadSuccessRef = useRef(onLoadSuccess);
  const onRenderSuccessRef = useRef(onRenderSuccess);

  useEffect(() => {
    onLoadSuccessRef.current = onLoadSuccess;
    onRenderSuccessRef.current = onRenderSuccess;
  }, [onLoadSuccess, onRenderSuccess]);

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

        onLoadSuccessRef.current(pageNumber, { width: cssWidth, height: cssHeight });
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
        if (!cancelled) onRenderSuccessRef.current(pageNumber);
      } finally {
        page.cleanup();
      }
    };

    void renderPage().catch((error: unknown) => {
      if (isRenderingCancelledError(error)) return;
      console.error(`Failed to render PDF preview page ${pageNumber}`, error);
      // Settle the page even on failure. Otherwise a single failed page keeps a
      // staged layer from ever promoting, leaving the previous preview stuck
      // behind a permanent "updating" state instead of showing the new render.
      if (!cancelled) onRenderSuccessRef.current(pageNumber);
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

const getActiveLayer = (layers: PdfPreviewLayer[]) =>
  layers.find((layer) => layer.phase === "active") ?? null;

const addPreviewLayer = (layers: PdfPreviewLayer[], nextLayer: PdfPreviewLayer) => {
  const activeLayers = layers.filter((layer) => layer.phase === "active");
  return activeLayers.length === 0 ? [nextLayer] : [...activeLayers, nextLayer];
};

const updateLayer = (
  layers: PdfPreviewLayer[],
  layerId: number,
  updater: (layer: PdfPreviewLayer) => PdfPreviewLayer,
) => layers.map((layer) => (layer.id === layerId ? updater(layer) : layer));

const markPageRendered = (layers: PdfPreviewLayer[], layerId: number, pageNumber: number) => {
  let shouldPromote = false;

  const nextLayers = layers.map((layer) => {
    if (layer.id !== layerId || layer.renderedPages.includes(pageNumber)) return layer;

    const renderedPages = [...layer.renderedPages, pageNumber];
    const nextLayer = { ...layer, renderedPages };
    if (nextLayer.phase === "staged" && nextLayer.pageCount > 0 && renderedPages.length >= nextLayer.pageCount) {
      shouldPromote = true;
      return { ...nextLayer, phase: "active" as const };
    }

    return nextLayer;
  });

  if (!shouldPromote) return nextLayers;

  return nextLayers.map((layer) => {
    if (layer.id === layerId) return layer;
    if (layer.phase === "active") return { ...layer, phase: "exiting" as const };
    return layer;
  });
};

const removeLayer = (layers: PdfPreviewLayer[], layerId: number) =>
  layers.filter((layer) => layer.id !== layerId);

export function PdfCanvasPreview({ className, locale, resume }: PdfCanvasPreviewProps) {
  const [state, setState] = useState<PdfPreviewState>({
    status: "idle",
    error: null,
  });
  const [layers, setLayers] = useState<PdfPreviewLayer[]>([]);
  const layerIdRef = useRef(0);
  const requestIdRef = useRef(0);
  const hasPreviewRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;
    const delay = hasPreviewRef.current ? UPDATE_DEBOUNCE_MS : 0;

    setState({ status: "loading", error: null });

    const timeoutId = window.setTimeout(() => {
      void prepareResumePdfExport(resume, locale)
        .then((blob) => {
          if (cancelled || requestId !== requestIdRef.current) return;
          hasPreviewRef.current = true;
          setLayers((current) => addPreviewLayer(current, {
            blob,
            id: layerIdRef.current++,
            pageCount: 0,
            pageSizes: {},
            phase: getActiveLayer(current) ? "staged" : "active",
            renderedPages: [],
          }));
          setState({ status: "idle", error: null });
        })
        .catch((error: unknown) => {
          if (cancelled || requestId !== requestIdRef.current) return;
          console.error("Failed to generate PDF preview", error);
          setState({ status: "error", error });
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [resume, locale]);

  const activeLayer = getActiveLayer(layers);
  const hasVisibleLayer = layers.some((layer) => layer.phase === "active" || layer.phase === "exiting");
  const isActiveLayerRendering = Boolean(
    activeLayer && (activeLayer.pageCount === 0 || activeLayer.renderedPages.length < activeLayer.pageCount),
  );

  if (state.status === "error" && !hasVisibleLayer) {
    return <PdfPreviewError />;
  }

  if (!hasVisibleLayer) {
    return <PdfPreviewLoader />;
  }

  return (
    <div className={cn("relative grid", className)}>
      {layers.map((layer) => {
        const pageNumbers = Array.from({ length: layer.pageCount }, (_, index) => index + 1);

        return (
          <div
            key={layer.id}
            aria-hidden={layer.phase !== "active"}
            className={cn(
              "col-start-1 row-start-1 transition-opacity",
              layer.phase !== "active" && "pointer-events-none",
              layer.phase === "active" ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDuration: `${CROSSFADE_DURATION_MS}ms` }}
            onTransitionEnd={() => {
              if (layer.phase !== "exiting") return;
              setLayers((current) => removeLayer(current, layer.id));
            }}
          >
            <PdfCanvasDocument
              file={layer.blob}
              onLoadSuccess={(document) => {
                setLayers((current) => updateLayer(current, layer.id, (item) => ({
                  ...item,
                  pageCount: document.numPages,
                })));
              }}
            >
              {(document) => (
                <div className="flex flex-col items-center gap-6">
                  {pageNumbers.map((pageNumber) => (
                    <PdfCanvasPage
                      key={`${layer.id}-${pageNumber}`}
                      document={document}
                      pageNumber={pageNumber}
                      pageSize={layer.pageSizes[pageNumber]}
                      onLoadSuccess={(_, pageSize) => {
                        setLayers((current) => updateLayer(current, layer.id, (item) => ({
                          ...item,
                          pageSizes: {
                            ...item.pageSizes,
                            [pageNumber]: pageSize,
                          },
                        })));
                      }}
                      onRenderSuccess={(renderedPageNumber) => {
                        setLayers((current) => markPageRendered(current, layer.id, renderedPageNumber));
                      }}
                    />
                  ))}
                </div>
              )}
            </PdfCanvasDocument>
          </div>
        );
      })}
      {state.status === "loading" && activeLayer ? (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/10 bg-neutral-950/70 px-3 py-1 text-xs text-neutral-200 shadow-lg backdrop-blur">
          正在更新 PDF 预览...
        </div>
      ) : null}
      {isActiveLayerRendering ? (
        <div className="pointer-events-none absolute inset-0 flex justify-center">
          <PdfPreviewLoader />
        </div>
      ) : null}
    </div>
  );
}
