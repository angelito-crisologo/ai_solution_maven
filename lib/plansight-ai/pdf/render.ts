import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * Render a @react-pdf Document component to a Node Buffer suitable for
 * returning as a Response with content-type application/pdf. Forced to
 * the Node runtime in route handlers (Edge can't ship the React-PDF
 * fontkit dependency).
 */
export async function renderPdfToBuffer(element: ReactElement): Promise<Buffer> {
  return renderToBuffer(element);
}
