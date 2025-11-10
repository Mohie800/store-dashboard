export interface PdfExportOptions {
  filename?: string;
  orientation?: "portrait" | "landscape";
  unit?: "mm" | "pt" | "cm" | "in";
  format?: "a4" | "letter" | "legal";
  margin?: number;
  scale?: number;
  backgroundColor?: string;
}

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  filename: "document.pdf",
  orientation: "portrait",
  unit: "mm",
  format: "a4",
  margin: 10,
  scale: 2,
  backgroundColor: "#ffffff",
};
