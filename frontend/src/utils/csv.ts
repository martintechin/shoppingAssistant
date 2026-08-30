import { FoodItem } from "../types/shared";

const CSV_HEADERS = ["id", "name", "category", "unit"] as const;

export function foodItemsToCsv(items: FoodItem[]): string {
  const rows = [CSV_HEADERS.join(",")];
  for (const item of items) {
    rows.push(
      CSV_HEADERS.map((h) => csvEscape(item[h])).join(",")
    );
  }
  return rows.join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export interface CsvFoodItem {
  id?: string;
  name: string;
  category: string;
  unit: string;
}

export function parseFoodItemsCsv(text: string): CsvFoodItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const categoryIdx = headers.indexOf("category");
  const unitIdx = headers.indexOf("unit");
  const idIdx = headers.indexOf("id");

  if (nameIdx === -1 || categoryIdx === -1 || unitIdx === -1) {
    throw new Error("CSV must have columns: name, category, unit");
  }

  const items: CsvFoodItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = cols[nameIdx]?.trim() ?? "";
    const category = cols[categoryIdx]?.trim() ?? "";
    const unit = cols[unitIdx]?.trim() ?? "";
    if (!name || !category || !unit) continue;

    const item: CsvFoodItem = { name, category, unit };
    if (idIdx !== -1 && cols[idIdx]?.trim()) {
      item.id = cols[idIdx].trim();
    }
    items.push(item);
  }
  return items;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function downloadCsv(csv: string, filename: string): void {
  const BOM = "﻿";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Read a CSV file as text, handling encoding correctly.
 *
 * File.text() always decodes as UTF-8. CSV files saved by Excel on Windows
 * are often encoded in the system ANSI codepage (e.g. Windows-1252 for
 * Swedish/Western European locales). Non-ASCII bytes like 0xF6 (ö) are
 * invalid UTF-8 and become U+FFFD (�).
 *
 * Strategy:
 * 1. Read as UTF-8 first (covers UTF-8 with or without BOM).
 * 2. If replacement characters appear, re-read with Windows-1252 fallback.
 */
export async function readCsvFile(file: File): Promise<string> {
  const utf8Text = await file.text();
  if (!utf8Text.includes("�")) {
    // Valid UTF-8 (with or without BOM — the BOM is stripped by .text())
    return utf8Text;
  }
  // Re-read as Windows-1252 (covers Latin-1 superset used by Western European Windows)
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "windows-1252");
  });
}
