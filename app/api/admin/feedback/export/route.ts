import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  csvFilenameForProduct,
  feedbackRowsToCsv
} from "@/lib/feedback/csv";
import {
  listFeedbackForProduct,
  parseFeedbackFilter
} from "@/lib/feedback/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CSV export of feedback submissions for one product. Same gate as the
// admin pages — anyone who isn't ADMIN_USER_ID gets a 404 redirect, no
// signal that the route exists. Filters are read from the same query
// params the admin page uses so the link from the page just inherits
// whatever the operator has selected.
//
// Capped at 1000 rows. If we ever need older history, that belongs
// behind a date-range or paginated export, not this one-shot pull.
const EXPORT_LIMIT = 1000;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const adminId = process.env.ADMIN_USER_ID;
  if (!user || !adminId || user.id !== adminId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const product = url.searchParams.get("product");
  if (!product || product.length === 0) {
    return new NextResponse("Missing product", { status: 400 });
  }

  const sp: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    sp[key] = value;
  });
  const filter = parseFeedbackFilter(sp);

  const rows = await listFeedbackForProduct(product, filter, EXPORT_LIMIT);
  const csv = feedbackRowsToCsv(rows);
  // Prepend a UTF-8 BOM so Excel auto-detects encoding on file open.
  const body = `﻿${csv}`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilenameForProduct(product)}"`,
      "Cache-Control": "no-store"
    }
  });
}
