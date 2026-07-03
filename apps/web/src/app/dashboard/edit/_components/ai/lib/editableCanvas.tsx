'use client';

// Re-export the single source of truth from the templates package so the living
// canvas' <EditableCanvasProvider> and the template fields' useEditableCanvas()
// read the SAME React context. Anchoring both to one context object is what makes
// the hover handle (指定优化) and the text-selection toolbar light up on the canvas
// while staying inert (enabled:false) in the plain preview / PDF export.
export * from '@magic-resume/resume-templates/renderer/EditableCanvas';
