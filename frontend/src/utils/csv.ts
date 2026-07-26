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
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
