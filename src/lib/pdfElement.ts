import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { PdfExportOptions } from "./pdfShared";
import { DEFAULT_PDF_OPTIONS } from "./pdfShared";

export async function exportElementToPDF(
  element: HTMLElement,
  options: PdfExportOptions = {}
) {
  if (typeof window === "undefined") {
    throw new Error("PDF export is only available in the browser");
  }

  const resolvedOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
  const {
    filename,
    orientation,
    unit,
    format,
    margin,
    scale,
    backgroundColor,
  } = resolvedOptions;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor,
    logging: false,
    scrollX: 0,
    scrollY: 0,
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation, unit, format });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const safeMargin = margin ?? 0;
  const contentWidth = pageWidth - safeMargin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let position = safeMargin;
  let heightLeft = contentHeight;

  pdf.addImage(
    imageData,
    "PNG",
    safeMargin,
    position,
    contentWidth,
    contentHeight,
    undefined,
    "FAST"
  );

  heightLeft -= pageHeight - safeMargin * 2;

  while (heightLeft > 0) {
    position = heightLeft - contentHeight + safeMargin;
    pdf.addPage();
    pdf.addImage(
      imageData,
      "PNG",
      safeMargin,
      position,
      contentWidth,
      contentHeight,
      undefined,
      "FAST"
    );
    heightLeft -= pageHeight - safeMargin * 2;
  }

  const fallbackName = DEFAULT_PDF_OPTIONS.filename ?? "document.pdf";
  pdf.save(filename ?? fallbackName);
}
