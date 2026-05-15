"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Printer, ScanBarcode } from "lucide-react";
import { BarcodeSvg } from "@/components/attendance/barcode-svg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import type { BarcodeStickerEncoding } from "@/lib/attendance-barcode";
import { attendanceBarcodePayload } from "@/lib/attendance-barcode";
import type { SchoolClassRow } from "@/lib/types";

type LabelRow = {
  id: number;
  name: string;
  admission_number: string;
  payload_admission: string;
  payload_sid: string;
};

type LabelFilterField = "admission" | "sid";

function normAdmission(s: string): string {
  return s.trim().replace(/\s+/g, "").toLowerCase();
}

function filterStudentsByField(students: LabelRow[], field: LabelFilterField, rawQuery: string): LabelRow[] {
  const q = rawQuery.trim();
  if (q === "") return students;

  if (field === "admission") {
    const needle = normAdmission(q);
    return students.filter(
      (s) =>
        needle !== "" &&
        (normAdmission(s.admission_number).includes(needle) ||
          normAdmission(s.payload_admission).includes(needle))
    );
  }

  const ql = q.toLowerCase().replace(/^sid\s*[:.\-]?\s*/i, "").trim();
  const idNeedle = ql || q.replace(/\D/g, "").trim();

  return students.filter((s) => {
    if (idNeedle === "") {
      return s.payload_sid.toLowerCase().includes(q.toLowerCase());
    }
    return String(s.id).includes(idNeedle) || s.payload_sid.toLowerCase().includes(idNeedle);
  });
}

function safeFilePart(s: string): string {
  const t = s.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return t.slice(0, 48) || "class";
}

type JsBarcodeFn = (el: HTMLCanvasElement, text: string, opts: Record<string, unknown>) => void;

/** Renders Code 128 to a JPEG data URL inside a fixed box (same idea as on-screen BarcodeSvg). */
function barcodePayloadToJpegUrl(
  JsBarcode: JsBarcodeFn,
  payload: string,
  boxW_px: number,
  boxH_px: number
): string | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;
  const nat = document.createElement("canvas");
  try {
    JsBarcode(nat, trimmed, {
      format: "CODE128",
      displayValue: true,
      fontSize: 11,
      height: 38,
      margin: 4,
      width: 2,
    });
  } catch {
    return null;
  }
  const natW = nat.width;
  const natH = nat.height;
  if (!natW || !natH) return null;

  const out = document.createElement("canvas");
  out.width = boxW_px;
  out.height = boxH_px;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, boxW_px, boxH_px);
  const pad = 6;
  const scale = Math.min((boxW_px - pad * 2) / natW, (boxH_px - pad * 2) / natH);
  if (!Number.isFinite(scale) || scale <= 0) return null;
  const dw = natW * scale;
  const dh = natH * scale;
  const dx = (boxW_px - dw) / 2;
  const dy = (boxH_px - dh) / 2;
  ctx.drawImage(nat, dx, dy, dw, dh);
  return out.toDataURL("image/jpeg", 0.92);
}

/**
 * Builds A4 PDFs without html2canvas (SVG + CSS transforms break DOM capture in many browsers).
 */
async function buildBarcodeLabelsPdf(options: {
  students: LabelRow[];
  encoding: BarcodeStickerEncoding;
  classMeta: { name: string; section: string | null };
  saveStem: string;
  filterNote: string | null;
}): Promise<void> {
  const [{ default: JsBarcode }, { jsPDF }] = await Promise.all([
    import("jsbarcode"),
    import("jspdf"),
  ]);

  const { students, encoding, classMeta, saveStem, filterNote } = options;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const cols = 3;
  const colGap = 4;
  const rowGap = 4;
  const headerH = filterNote ? 14 : 10;
  const cellW = (pageW - 2 * margin - colGap * (cols - 1)) / cols;
  const barInset = 2;
  const barW_mm = cellW - barInset * 2;
  const barH_mm = 18;
  const barW_px = Math.max(80, Math.round(barW_mm * 4));
  const barH_px = Math.max(60, Math.round(barH_mm * 4));
  const cellRowPitch = barH_mm + 16 + (encoding === "sid" ? 4 : 0);
  const gridTop = margin + headerH;
  const innerH = pageH - gridTop - margin;
  const rowsPerPage = Math.max(1, Math.floor((innerH + rowGap) / (cellRowPitch + rowGap)));
  const perPage = cols * rowsPerPage;

  const titleLine = `${classMeta.name}${classMeta.section ? ` (${classMeta.section})` : ""} · ${
    encoding === "admission" ? "Admission Code 128" : "SID Code 128"
  }`;

  const drawPageHeader = () => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(23, 23, 23);
    pdf.text(titleLine, pageW / 2, margin + 5, { align: "center", maxWidth: pageW - 2 * margin });
    if (filterNote) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text(filterNote, pageW / 2, margin + 9.5, { align: "center", maxWidth: pageW - 2 * margin });
    }
  };

  for (let i = 0; i < students.length; i++) {
    if (i > 0 && i % perPage === 0) {
      pdf.addPage();
    }
    if (i % perPage === 0) {
      drawPageHeader();
    }

    const local = i % perPage;
    const col = local % cols;
    const row = Math.floor(local / cols);
    const xLeft = margin + col * (cellW + colGap);
    const yTop = gridTop + row * (cellRowPitch + rowGap);
    const cx = xLeft + cellW / 2;

    const s = students[i];
    const payload = attendanceBarcodePayload(s, encoding);
    const jpeg = barcodePayloadToJpegUrl(JsBarcode as JsBarcodeFn, payload, barW_px, barH_px);
    if (jpeg) {
      pdf.addImage(jpeg, "JPEG", xLeft + barInset, yTop, barW_mm, barH_mm);
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(200, 0, 0);
      pdf.text("Invalid for Code 128", cx, yTop + 6, { align: "center", maxWidth: cellW - 4 });
      pdf.setTextColor(0, 0, 0);
    }

    let yText = yTop + barH_mm + 3;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(23, 23, 23);
    pdf.text(s.name, cx, yText, { align: "center", maxWidth: cellW - 4 });
    yText += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Adm. ${s.admission_number}`, cx, yText, { align: "center", maxWidth: cellW - 4 });
    if (encoding === "sid") {
      yText += 4;
      pdf.setFontSize(7);
      pdf.text(s.payload_sid, cx, yText, { align: "center", maxWidth: cellW - 4 });
    }

    if (i % 12 === 11) {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }
  }

  pdf.save(`${saveStem}.pdf`);
}

export function BarcodeLabelsClient() {
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [encoding, setEncoding] = useState<BarcodeStickerEncoding>("admission");
  const [classMeta, setClassMeta] = useState<{ id: number; name: string; section: string | null } | null>(
    null
  );
  const [students, setStudents] = useState<LabelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filterField, setFilterField] = useState<LabelFilterField>("admission");
  const [filterQuery, setFilterQuery] = useState("");
  const [downloading, setDownloading] = useState(false);

  const filteredStudents = useMemo(
    () => filterStudentsByField(students, filterField, filterQuery),
    [students, filterField, filterQuery]
  );

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=100");
      if (r.json?.success && r.json.data?.items) {
        const list = r.json.data.items;
        setClasses(list);
        setClassId((prev) => prev || (list[0]?.id != null ? String(list[0].id) : ""));
      }
    })();
  }, []);

  const loadRows = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      setClassMeta(null);
      return;
    }
    setLoading(true);
    setErr(null);
    const r = await apiFetch<{
      class: { id: number; name: string; section: string | null };
      students: LabelRow[];
    }>(`classes/${classId}/barcode-labels`);
    setLoading(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      setErr(r.json?.message ?? "Could not load roster.");
      setStudents([]);
      setClassMeta(null);
      return;
    }
    setClassMeta(r.json.data.class);
    setStudents(r.json.data.students);
  }, [classId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const downloadPdf = useCallback(async () => {
    if (filteredStudents.length === 0 || !classMeta) return;
    setDownloading(true);
    setErr(null);
    const enc = encoding === "admission" ? "admission" : "sid";
    const stem = `barcode-labels-${safeFilePart(`${classMeta.name}${classMeta.section ? `-${classMeta.section}` : ""}`)}-${enc}`;
    const filterNote =
      filterQuery.trim() !== ""
        ? `Showing ${filteredStudents.length} of ${students.length} (${filterField === "admission" ? "admission filter" : "SID filter"})`
        : null;
    try {
      await buildBarcodeLabelsPdf({
        students: filteredStudents,
        encoding,
        classMeta,
        saveStem: stem,
        filterNote,
      });
    } catch (e) {
      console.warn("barcode PDF build failed", e);
      setErr("Could not build the PDF. Try Print sheet, or update your browser.");
    } finally {
      setDownloading(false);
    }
  }, [filteredStudents, classMeta, encoding, filterQuery, filterField, students.length]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <Link
            href="/attendance"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Attendance
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Barcode labels</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Print Code 128 stickers that match your attendance scanner. Use{" "}
            <strong className="font-medium text-foreground">admission number</strong> for stable ID cards, or{" "}
            <strong className="font-medium text-foreground">SID</strong> for internal database ids.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={downloading || filteredStudents.length === 0 || !classMeta}
            onClick={() => void downloadPdf()}
          >
            <Download className="size-4" aria-hidden />
            {downloading ? "Preparing…" : "Download PDF"}
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Print sheet
          </Button>
        </div>
      </div>

      <Card className="mb-8 border-border/70 shadow-sm print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanBarcode className="size-4 text-teal-700 dark:text-teal-400" aria-hidden />
            Setup
          </CardTitle>
          <CardDescription>
            Choose the class and encoding, then print. The same class must be selected when scanning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="bl_class">Class</Label>
            <select
              id="bl_class"
              className="flex h-10 min-w-[12rem] rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.section ? ` (${c.section})` : ""}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Encode in barcode</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="enc"
                  className="accent-teal-600"
                  checked={encoding === "admission"}
                  onChange={() => setEncoding("admission")}
                />
                Admission number
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="enc"
                  className="accent-teal-600"
                  checked={encoding === "sid"}
                  onChange={() => setEncoding("sid")}
                />
                SID:«id» (internal)
              </label>
            </div>
          </fieldset>
          <Button type="button" variant="secondary" onClick={() => void loadRows()} disabled={loading || !classId}>
            Reload
          </Button>
          </div>

          <fieldset className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
            <legend className="px-1 text-sm font-medium">Filter labels</legend>
            <p className="text-xs text-muted-foreground">
              Narrow who appears below and what prints. Leave empty to show everyone in the class.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="filter-field"
                  className="accent-teal-600"
                  checked={filterField === "admission"}
                  onChange={() => setFilterField("admission")}
                />
                By admission number
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="filter-field"
                  className="accent-teal-600"
                  checked={filterField === "sid"}
                  onChange={() => setFilterField("sid")}
                />
                By SID (database id)
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1 space-y-2 sm:max-w-xs">
                <Label htmlFor="bl_filter">{filterField === "admission" ? "Admission contains" : "SID / id contains"}</Label>
                <Input
                  id="bl_filter"
                  className="h-10"
                  placeholder={
                    filterField === "admission" ? "e.g. 375 or partial …" : "e.g. 12 or SID:12 …"
                  }
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {filterQuery.trim() !== "" && (
                <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => setFilterQuery("")}>
                  Clear filter
                </Button>
              )}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {err && (
        <p className="mb-4 text-sm text-destructive print:hidden" role="alert">
          {err}
        </p>
      )}

      {loading && <p className="text-sm text-muted-foreground print:hidden">Loading roster…</p>}

      {!loading && classId && students.length === 0 && !err && (
        <p className="text-sm text-muted-foreground print:hidden">No students in this class.</p>
      )}

      {!loading && classId && students.length > 0 && filteredStudents.length === 0 && !err && (
        <p className="mb-4 text-sm text-muted-foreground print:hidden" role="status">
          No students match this filter ({filterField === "admission" ? "admission number" : "SID"}).
        </p>
      )}

      {!loading && classMeta && filteredStudents.length > 0 ? (
      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-sm dark:border-neutral-200 dark:bg-white dark:text-neutral-900">
        {classMeta && (
          <p className="text-center text-sm font-medium">
            {classMeta.name}
            {classMeta.section ? ` (${classMeta.section})` : ""} ·{" "}
            {encoding === "admission" ? "Admission Code 128" : "SID Code 128"}
            {filterQuery.trim() !== "" ? (
              <span className="mt-1 block text-xs font-normal text-neutral-600 print:hidden">
                Showing {filteredStudents.length} of {students.length}{" "}
                {filterField === "admission" ? "(admission filter)" : "(SID filter)"}
              </span>
            ) : null}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3">
          {filteredStudents.map((s) => {
            const payload = attendanceBarcodePayload(s, encoding);
            return (
              <div
                key={s.id}
                className="flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm print:break-inside-avoid dark:bg-white"
              >
                <BarcodeSvg value={payload} height={38} width={2} />
                <p className="mt-3 max-w-full truncate text-sm font-semibold text-neutral-900">{s.name}</p>
                <p className="text-xs text-neutral-600">Adm. {s.admission_number}</p>
                {encoding === "sid" && (
                  <p className="mt-1 font-mono text-[10px] text-neutral-600">{s.payload_sid}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      ) : null}
    </div>
  );
}
