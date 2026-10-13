import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface PdfOptions {
  fileName?: string;
  orientation?: "portrait" | "landscape";
  unit?: "mm" | "pt" | "in" | "px";
  format?: "a4" | "letter";
}

/**
 * Generate PDF from an HTML element
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: PdfOptions = {}
): Promise<Blob> {
  const {
    fileName = "document.pdf",
    orientation = "portrait",
    format = "a4",
  } = options;

  // Capture canvas using html2canvas
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 0;

  // Handle multi-page content
  let heightLeft = imgHeight * ratio;
  let position = 0;

  pdf.addImage(
    imgData,
    "JPEG",
    imgX,
    position,
    imgWidth * ratio,
    imgHeight * ratio
  );
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight * ratio;
    pdf.addPage();
    pdf.addImage(
      imgData,
      "JPEG",
      imgX,
      position,
      imgWidth * ratio,
      imgHeight * ratio
    );
    heightLeft -= pdfHeight;
  }

  return pdf.output("blob");
}

/**
 * Download generated PDF directly in browser
 */
export async function downloadPdfFromElement(
  element: HTMLElement,
  fileName: string = "document.pdf",
  options: PdfOptions = {}
): Promise<void> {
  const blob = await generatePdfFromElement(element, { ...options, fileName });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
