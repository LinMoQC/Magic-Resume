import React from 'react';
import { Font, pdf } from '@react-pdf/renderer';
import type { MagicTemplateDSL } from '../types/magic-dsl';
import type { Resume } from '../types/resume';
import { magicPdfHyphenationCallback } from './hyphenation';
import { MagicResumePdfDocument } from './MagicResumePdfDocument';

export interface CreateMagicResumePdfBlobOptions {
  data: Resume;
  template: MagicTemplateDSL;
  locale?: string;
}

let fontsRegistered = false;

const registerFonts = () => {
  if (fontsRegistered) return;
  if (typeof window === 'undefined') throw new Error('PDF export is only available in the browser.');

  const baseUrl = window.location.origin;
  Font.register({
    family: 'Source Han Sans SC',
    fonts: [
      { src: `${baseUrl}/fonts/SourceHanSansSC-Regular.otf`, fontWeight: 400 },
      { src: `${baseUrl}/fonts/SourceHanSansSC-RegularOblique.woff`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${baseUrl}/fonts/SourceHanSansSC-Bold.otf`, fontWeight: 700 },
      { src: `${baseUrl}/fonts/SourceHanSansSC-BoldOblique.woff`, fontWeight: 700, fontStyle: 'italic' },
    ],
  });
  Font.register({
    family: 'Source Han Serif SC',
    fonts: [
      { src: `${baseUrl}/fonts/SourceHanSerifSC-Regular.woff`, fontWeight: 400 },
      { src: `${baseUrl}/fonts/SourceHanSerifSC-RegularOblique.woff`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${baseUrl}/fonts/SourceHanSerifSC-Bold.woff`, fontWeight: 700 },
      { src: `${baseUrl}/fonts/SourceHanSerifSC-BoldOblique.woff`, fontWeight: 700, fontStyle: 'italic' },
    ],
  });
  Font.registerHyphenationCallback(magicPdfHyphenationCallback);
  fontsRegistered = true;
};

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
}: CreateMagicResumePdfBlobOptions): Promise<Blob> => {
  registerFonts();
  const preparedData = await prepareResumeImages(data);
  const document = (
    <MagicResumePdfDocument data={preparedData} template={template} locale={locale} />
  );

  return pdf(document).toBlob();
};
