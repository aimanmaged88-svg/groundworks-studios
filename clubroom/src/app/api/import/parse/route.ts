import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { getClubContext } from "@/lib/club";
import { autoMap, parseCsv } from "@/lib/import";

const MAX_ROWS = 2000;

/**
 * Reads an uploaded spreadsheet (xlsx or csv) and returns headers, rows and a
 * suggested mapping. Nothing is written. The file itself is never stored.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "");
  const file = form.get("file");
  if (!slug || !(file instanceof File)) return NextResponse.json({ ok: false, error: "Choose a file." }, { status: 400 });
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) return NextResponse.json({ ok: false, error: "Admins only" }, { status: 403 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ ok: false, error: "Keep the file under 10 MB." }, { status: 413 });

  let headers: string[] = [];
  let rows: Record<string, unknown>[] = [];
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".csv") || file.type === "text/csv") {
    const grid = parseCsv(buf.toString("utf8"));
    headers = (grid[0] ?? []).map((h) => h.trim());
    rows = grid.slice(1, MAX_ROWS + 1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
  } else if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) return NextResponse.json({ ok: false, error: "The workbook has no sheets." }, { status: 422 });
    const headerRow = ws.getRow(1);
    headers = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
      headers[col - 1] = String(cellValue(cell.value) ?? "").trim();
    });
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || rows.length >= MAX_ROWS) return;
      const obj: Record<string, unknown> = {};
      let any = false;
      headers.forEach((h, i) => {
        if (!h) return;
        const v = cellValue(row.getCell(i + 1).value);
        if (v != null && v !== "") any = true;
        obj[h] = v;
      });
      if (any) rows.push(obj);
    });
    headers = headers.filter(Boolean);
  } else {
    return NextResponse.json({ ok: false, error: "Use an .xlsx or .csv file." }, { status: 415 });
  }

  if (!headers.length) return NextResponse.json({ ok: false, error: "Couldn't find a header row." }, { status: 422 });
  return NextResponse.json({ ok: true, headers, rows, total: rows.length, mapping: autoMap(headers), fileName: file.name });
}

function cellValue(v: ExcelJS.CellValue): unknown {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return v.text;
    if ("result" in v) return v.result;
    if ("hyperlink" in v) {
      const h = v as { text?: unknown; hyperlink?: unknown };
      return h.text ?? h.hyperlink;
    }
    return String(v);
  }
  return v;
}
