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
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { prepareResumePdfExport } from "@/lib/utils/pdf-export";
import { cn } from "@/lib/utils";
import type { Resume } from "@/types/frontend/resume";
import { PaperSheet, PaperSkeletonBars } from "./PaperSkeleton";

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
// A4 at 96dpi (595.28pt × 841.89pt). Used only for the very first paint, when no
// previous frame exists to inherit sizes from (B4). Subsequent frames carry the
// last frame's real page sizes so an in-flight layer never collapses to this
// default and jolts the layout.
const DEFAULT_PAGE_WIDTH = 794;
const DEFAULT_PAGE_HEIGHT = 1123;

const isRenderingCancelledError = (error: unknown) =>
  error instanceof RenderingCancelledException ||
  (typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "RenderingCancelledException");

// 首帧占位:一张近白的"纸"(简历画布浅深两态恒定近白),而非深色块——深色纸叠在
// #0A0A0A 台面上几乎隐形,叠加首次 PDF 生成的主线程阻塞(pulse 也冻住)就成了"卡一下
// 下面黑"。用白纸 + 灰骨架条,既清晰可见,又能与随后出现的白色 canvas 无缝 crossfade。
// 首帧占位纸。两个轴都要铺满 grid 单元,接缝才不会露:
//   高度 —— self-stretch + min-h 单页兜底,多页时盖住整叠 canvas,无"上半页蒙 veil、下半页
//   已清晰"的横向接缝;
//   宽度 —— w-full + min-w 兜底(经 twMerge 覆盖 PaperSheet 的固定宽)。页宽不是恒定 794:
//   Letter 是 816、free-form 模板宽度跟随 layout.containerWidth(见 resume-templates 的
//   page-size.ts),固定 794 会在宽页两侧露出竖条 canvas。grid 单元宽度天然等于 canvas
//   真实宽度,w-full 让白纸始终同宽;窄于 794 时 min-w 兜底,白纸略宽出的边缘只是在深色
//   桌面上淡出,远好于露缝。
// 骨架条包在独立 motion 里,退出时
// 先它一步淡出(见调用处分拍时序:骨架条先淡出→白纸此刻仍不透明挡住 canvas→白纸再化开露出
// 文字),避免骨架条与真实文字短暂重影。纸与骨架条复用 PaperSkeleton 模块 —— 和 chunk 加载期
// 的 dynamic fallback(见 ResumePreviewPanel)渲染完全一致、呼吸相位也对齐(挂钟同步),
// 两段占位无缝衔接。animate-pulse 在 PaperSkeletonBars 内层,与外层 framer opacity 分属不同
// 元素、互不覆盖(同元素上 CSS 动画会压过 framer 写的 inline opacity)。
function PdfPreviewLoader({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <PaperSheet className="w-full min-w-[794px] self-stretch">
      <motion.div
        className="p-14"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.12, ease: "easeOut" }}
      >
        <PaperSkeletonBars />
      </motion.div>
    </PaperSheet>
  );
}

function PdfPreviewError() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[420px] w-[640px] items-center justify-center rounded-lg border border-red-500/30 bg-red-950/20 px-8 text-center text-sm text-red-100 shadow-2xl shadow-black/40">
      {t('pdfPreview.generateFailed')}
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
      style={pageSize ?? { width: DEFAULT_PAGE_WIDTH, height: DEFAULT_PAGE_HEIGHT }}
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
  const reduceMotion = useReducedMotion();
  const layerIdRef = useRef(0);
  const requestIdRef = useRef(0);
  const hasPreviewRef = useRef(false);

  // B1 渲染指纹:只有影响 PDF 渲染的字段变化才重绘。避免 updatedAt / syncStatus /
  // 保存 / 云同步等非渲染字段导致的无谓重生成 —— 那是编辑时闪烁的一大来源。
  // ⚠️ 凡是会进 PDF 的字段都必须列进来,漏了就改了不重绘(表现为"自定义失效")。
  // customTemplate 承载右侧面板的全部自定义(布局 / 排版 / 配色),务必包含。
  const resumeRef = useRef(resume);
  resumeRef.current = resume;
  const renderKey = useMemo(
    () => JSON.stringify([
      resume.info,
      resume.sections,
      resume.sectionOrder,
      resume.template,
      resume.customTemplate,
      resume.themeColor,
      resume.typography,
      locale,
    ]),
    [resume, locale],
  );

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;
    const delay = hasPreviewRef.current ? UPDATE_DEBOUNCE_MS : 0;

    setState({ status: "loading", error: null });

    const timeoutId = window.setTimeout(() => {
      void prepareResumePdfExport(resumeRef.current, locale)
        .then((blob) => {
          if (cancelled || requestId !== requestIdRef.current) return;
          hasPreviewRef.current = true;
          setLayers((current) => {
            const previous = getActiveLayer(current);
            return addPreviewLayer(current, {
              blob,
              id: layerIdRef.current++,
              // B4:沿用上一帧的页数与页尺寸。新层在自己的真实尺寸就位前不塌成默认
              // A4——即便 staged 层不可见,它仍占据 grid 单元,用默认尺寸会撑动容器
              // 造成尺寸跳动。继承上帧尺寸让容器在 promote 前保持稳定。
              pageCount: previous?.pageCount ?? 0,
              pageSizes: previous ? { ...previous.pageSizes } : {},
              phase: previous ? "staged" : "active",
              renderedPages: [],
            });
          });
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
  }, [renderKey, locale]);

  const activeLayer = getActiveLayer(layers);
  const hasVisibleLayer = layers.some((layer) => layer.phase === "active" || layer.phase === "exiting");
  const isActiveLayerRendering = Boolean(
    activeLayer && (activeLayer.pageCount === 0 || activeLayer.renderedPages.length < activeLayer.pageCount),
  );

  if (state.status === "error" && !hasVisibleLayer) {
    return <PdfPreviewError />;
  }

  // 首帧骨架:无可见层 或 active 层仍在渲染时显示。关键是它与后续 canvas 同处一个 grid,
  // 且从"无层"到"首帧渲染中"始终是同一个 React 节点 —— 不再像旧版那样在 hasVisibleLayer
  // 翻转时卸载独立 loader、重挂 overlay loader。重挂会重置 animate-pulse 相位并让容器塌陷,
  // 正是"骨架结束瞬间闪一下"的根因。统一后 pulse 连续、布局稳定,画完 crossfade 淡出露出 canvas。
  const showFirstPaintLoader = !hasVisibleLayer || isActiveLayerRendering;

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
      {/* B5 + C2:首帧骨架与 canvas 同占 grid 单元(col/row-start-1)并叠在其上,画完后揭示,
          替代硬切。编辑时新帧走 staged 层,不触发此 loader → 无提示噪声。
          分拍退出:外层(白纸)延迟 0.12s 再化开 → 内层骨架条(见 PdfPreviewLoader)先在这 0.12s
          里淡出;白纸化开前骨架条已归零,揭示只剩"白 → 文字"的显影,无骨架条重影、无半截接缝。
          initial={false}:首挂不做淡入,避免刚进页面时骨架先淡入一下。 */}
      <AnimatePresence initial={false}>
        {showFirstPaintLoader ? (
          <motion.div
            key="first-paint-loader"
            className="pointer-events-none z-10 col-start-1 row-start-1 flex justify-center self-stretch"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, delay: reduceMotion ? 0 : 0.12, ease: "easeOut" }}
          >
            <PdfPreviewLoader reduceMotion={Boolean(reduceMotion)} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
