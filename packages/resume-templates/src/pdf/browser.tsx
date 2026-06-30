import React from 'react';
import { pdf } from '@react-pdf/renderer';
import type { MagicTemplateDSL } from '../types/magic-dsl';
import type { Resume } from '../types/resume';
import { MagicResumePdfDocument } from './document';
import { registerMagicResumePdfFonts } from './fonts';

export interface CreateMagicResumePdfBlobOptions {
  data: Resume;
  template: MagicTemplateDSL;
  locale?: string;
  /** 单页连续模式的页高(pt);由调用方测量预览 DOM 高度换算传入。 */
  pageHeight?: number;
}

const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error ?? new Error('Failed to read image data.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(blob);
});

const prepareResumeImages = async (data: Resume): Promise<Resume> => {
  const avatar = data.info.avatar;
  if (!avatar || avatar.startsWith('data:')) return data;

  try {
    const response = await fetch(avatar);
    if (!response.ok) throw new Error(`Avatar request failed with ${response.status}.`);
    const dataUrl = await blobToDataUrl(await response.blob());
    return { ...data, info: { ...data.info, avatar: dataUrl } };
  } catch {
    // A remote avatar should not prevent the rest of the resume from exporting.
    return { ...data, info: { ...data.info, avatar: '' } };
  }
};

export const createMagicResumePdfBlob = async ({
  data,
  template,
  locale,
  pageHeight,
}: CreateMagicResumePdfBlobOptions): Promise<Blob> => {
  if (typeof window === 'undefined') throw new Error('PDF export is only available in the browser.');
  const preparedData = await prepareResumeImages(data);
  registerMagicResumePdfFonts({ baseUrl: `${window.location.origin}/fonts`, data: preparedData });
  const document = (
    <MagicResumePdfDocument data={preparedData} template={template} locale={locale} pageHeight={pageHeight} />
  );

  return pdf(document).toBlob();
};
