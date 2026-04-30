/**
 * BOM Parser — CSV/XLSX parsing and material matching
 *
 * Input: BOM file (CSV or XLSX)
 * Expected columns:
 *   - material_name (or "Material", "Mat. Name")
 *   - quantity_grams (or "Quantity (g)", "Qty g")
 *   - component_id (or "Component ID", "Part Number")
 *   - supplier_country (or "Supplier", "Origin")
 *   - unit_cost_eur (or "Cost €", "Price")
 *   - [optional] cas_number, cas, formula
 *
 * Output: ParsedBOM with matched materials and unmatched warnings
 */

import * as XLSX from "xlsx";

export interface BOMRow {
  material_name: string;
  quantity_grams: number;
  component_id?: string;
  supplier_country?: string;
  unit_cost_eur?: number;
  cas_number?: string;
  // Calculated
  matched_material_id?: string;
  match_score?: number;  // 0-100 confidence
  warnings?: string[];
}

export interface ParsedBOM {
  rows: BOMRow[];
  matched_count: number;
  unmatched_count: number;
  total_grams: number;
  total_value_eur: number;
  warnings: string[];
}

// ============================================================
// MATERIAL NORMALIZER (for fuzzy matching)
// ============================================================

function normalizeMaterialName(name: string): string {
  return String(name)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, "");
}

function calculateMatchScore(bomName: string, catalogName: string): number {
  const bomNorm = normalizeMaterialName(bomName);
  const catNorm = normalizeMaterialName(catalogName);

  // Exact match
  if (bomNorm === catNorm) return 100;

  // Substring match
  if (bomNorm.includes(catNorm) || catNorm.includes(bomNorm)) return 80;

  // Levenshtein-like: character overlap
  const overlap = bomNorm
    .split("")
    .filter((c) => catNorm.includes(c)).length;
  const matchPercent = (overlap / Math.max(bomNorm.length, catNorm.length)) * 100;

  return Math.min(70, matchPercent);
}

// ============================================================
// CSV PARSING (intelligent)
// ============================================================

function detectDelimiter(input: string): "," | ";" | "\t" {
  const sample = input.split(/\r?\n/).slice(0, 10).join("\n");
  const counts = {
    ",": (sample.match(/,/g) ?? []).length,
    ";": (sample.match(/;/g) ?? []).length,
    "\t": (sample.match(/\t/g) ?? []).length,
  };
  const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (ordered[0]?.[0] as "," | ";" | "\t") || ",";
}

function parseDelimited(inputText: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let insideQuotes = false;
  let currentField = "";

  for (let i = 0; i < inputText.length; i++) {
    const char = inputText[i];
    const nextChar = inputText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f)) {
          rows.push(currentRow);
        }
      }
      currentRow = [];
      currentField = "";
      if (char === "\r" && nextChar === "\n") i++;
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f)) rows.push(currentRow);
  }

  return rows;
}

function parseCSV(inputText: string): string[][] {
  const delimiter = detectDelimiter(inputText);
  return parseDelimited(inputText, delimiter);
}

// ============================================================
// COLUMN DETECTION
// ============================================================

interface ColumnMap {
  material_name: number;
  quantity_grams: number;
  quantity_unit?: number;
  component_id?: number;
  supplier_country?: number;
  unit_cost_eur?: number;
  cas_number?: number;
}

function looksLikeHeaderRow(row: string[]): boolean {
  const joined = normalizeMaterialName(row.join(" "));
  return (
    joined.includes("material") ||
    joined.includes("quantity") ||
    joined.includes("component") ||
    joined.includes("supplier") ||
    joined.includes("cas")
  );
}

function parseNumeric(value: string): number {
  const cleaned = String(value)
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function parseQuantityToGrams(quantityRaw: string, unitRaw?: string): number {
  const q = String(quantityRaw ?? "").trim();
  const unitCol = normalizeMaterialName(unitRaw ?? "");

  // Supports values like "0.4 kg", "120mg", "2,5 g".
  const embedded = q.match(/^\s*([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)?\s*$/);
  const parsedNumber = parseNumeric(embedded?.[1] ?? q);
  const embeddedUnit = normalizeMaterialName(embedded?.[2] ?? "");

  const unit = embeddedUnit || unitCol || "g";
  if (unit === "kg" || unit === "kilogram" || unit === "kilograms") {
    return parsedNumber * 1000;
  }
  if (unit === "mg" || unit === "milligram" || unit === "milligrams") {
    return parsedNumber / 1000;
  }
  return parsedNumber;
}

function detectColumns(headerRow: string[]): ColumnMap | null {
  const aliases = {
    material_name: [
      "material",
      "material_name",
      "mat",
      "name",
      "elemento",
      "material name",
    ],
    quantity_grams: [
      "quantity",
      "qty",
      "grams",
      "grammi",
      "g",
      "quantity_grams",
      "quantity (g)",
      "qty (g)",
      "weight_g",
      "weight",
      "mass",
    ],
    quantity_unit: ["unit", "uom", "measure unit", "qty_unit", "quantity_unit"],
    component_id: [
      "component",
      "component_id",
      "part",
      "part_number",
      "id",
      "part_id",
    ],
    supplier_country: [
      "supplier",
      "country",
      "supplier_country",
      "origin",
      "sourcing",
    ],
    unit_cost_eur: ["cost", "price", "unit_cost", "cost_eur", "€", "euro"],
    cas_number: ["cas", "cas_number", "cas number", "cas_num"],
  };

  const normalized = headerRow.map((h) => normalizeMaterialName(h));
  const map: ColumnMap = {} as any;

  for (const [key, alts] of Object.entries(aliases)) {
    for (let i = 0; i < normalized.length; i++) {
      for (const alt of alts) {
        if (normalized[i] === normalizeMaterialName(alt)) {
          (map as any)[key] = i;
          break;
        }
      }
      if ((map as any)[key] !== undefined) break;
    }

    // Fuzzy fallback for small header variations.
    if ((map as any)[key] === undefined) {
      for (let i = 0; i < normalized.length; i++) {
        for (const alt of alts) {
          if (normalized[i].includes(normalizeMaterialName(alt))) {
            (map as any)[key] = i;
            break;
          }
        }
        if ((map as any)[key] !== undefined) break;
      }
    }
  }

  // Mandatory columns
  if (map.material_name === undefined || map.quantity_grams === undefined) {
    return null;
  }

  return map;
}

function parseBOMFromRows(rowsRaw: string[][]): ParsedBOM {
  if (rowsRaw.length < 1) {
    return {
      rows: [],
      matched_count: 0,
      unmatched_count: 0,
      total_grams: 0,
      total_value_eur: 0,
      warnings: ["Empty file"],
    };
  }

  let headerIndex = 0;
  let colMap = detectColumns(rowsRaw[headerIndex]);

  // Try finding header row in the first few lines.
  if (!colMap) {
    for (let i = 1; i < Math.min(5, rowsRaw.length); i++) {
      if (looksLikeHeaderRow(rowsRaw[i])) {
        const candidate = detectColumns(rowsRaw[i]);
        if (candidate) {
          headerIndex = i;
          colMap = candidate;
          break;
        }
      }
    }
  }

  const warnings: string[] = [];
  if (!colMap) {
    // Last-resort positional fallback: col0 material, col1 quantity.
    const firstData = rowsRaw[0];
    if (firstData.length >= 2) {
      colMap = { material_name: 0, quantity_grams: 1 };
      headerIndex = -1;
      warnings.push("Header not detected: using fallback mapping [col0=material, col1=quantity]");
    } else {
      return {
        rows: [],
        matched_count: 0,
        unmatched_count: 0,
        total_grams: 0,
        total_value_eur: 0,
        warnings: ["Could not detect required columns (material_name, quantity_grams)"],
      };
    }
  }

  const parsedRows: BOMRow[] = [];
  let totalGrams = 0;
  let totalValue = 0;
  let skippedRows = 0;

  for (let i = headerIndex + 1; i < rowsRaw.length; i++) {
    const row = rowsRaw[i];
    if (!row || row.every((cell) => !String(cell ?? "").trim())) {
      continue;
    }

    const materialName = (row[colMap.material_name] ?? "").trim();
    const quantity = parseQuantityToGrams(
      row[colMap.quantity_grams] ?? "",
      colMap.quantity_unit !== undefined ? row[colMap.quantity_unit] : undefined
    );

    const bomRow: BOMRow = {
      material_name: materialName || "Unknown",
      quantity_grams: quantity,
      warnings: [],
    };

    if (colMap.component_id !== undefined) {
      bomRow.component_id = (row[colMap.component_id] ?? "").trim();
    }
    if (colMap.supplier_country !== undefined) {
      bomRow.supplier_country = (row[colMap.supplier_country] ?? "").trim();
    }
    if (colMap.unit_cost_eur !== undefined) {
      bomRow.unit_cost_eur = parseNumeric(row[colMap.unit_cost_eur] ?? "");
    }
    if (colMap.cas_number !== undefined) {
      bomRow.cas_number = (row[colMap.cas_number] ?? "").trim();
    }

    if (!bomRow.material_name || bomRow.material_name === "Unknown") {
      bomRow.warnings?.push("Empty material name");
      skippedRows++;
      continue;
    }

    if (bomRow.quantity_grams <= 0) {
      bomRow.warnings?.push("Invalid or missing quantity");
      skippedRows++;
      continue;
    }

    totalGrams += bomRow.quantity_grams;
    totalValue += bomRow.unit_cost_eur ?? 0;
    parsedRows.push(bomRow);
  }

  if (skippedRows > 0) {
    warnings.push(`${skippedRows} row(s) skipped due to missing material or invalid quantity`);
  }

  return {
    rows: parsedRows,
    matched_count: 0,
    unmatched_count: 0,
    total_grams: Math.round(totalGrams * 100) / 100,
    total_value_eur: Math.round(totalValue * 100) / 100,
    warnings,
  };
}

// ============================================================
// BOM PARSING FUNCTION
// ============================================================

export function parseBOMFromCSV(csvText: string): ParsedBOM {
  return parseBOMFromRows(parseCSV(csvText));
}

// ============================================================
// MATERIAL MATCHING (BOM rows → catalog materials)
// ============================================================

export function matchBOMToMaterials(
  bom: ParsedBOM,
  catalogMaterials: Array<{ name: string; id: string }>
): ParsedBOM {
  const matched = { ...bom };
  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const bomRow of matched.rows) {
    let bestMatch: { id: string; score: number } | null = null;

    for (const catMat of catalogMaterials) {
      const score = calculateMatchScore(bomRow.material_name, catMat.name);
      if (score > (bestMatch?.score ?? 0)) {
        bestMatch = { id: catMat.id, score };
      }
    }

    if (bestMatch && bestMatch.score >= 60) {
      // Confidence threshold
      bomRow.matched_material_id = bestMatch.id;
      bomRow.match_score = bestMatch.score;
      matchedCount++;
    } else {
      unmatchedCount++;
      bomRow.warnings?.push(`Could not match to catalog (best: ${bestMatch?.score}%)`);
    }
  }

  matched.matched_count = matchedCount;
  matched.unmatched_count = unmatchedCount;

  if (unmatchedCount > 0) {
    matched.warnings.push(
      `${unmatchedCount} material${unmatchedCount > 1 ? "s" : ""} not matched to catalog`
    );
  }

  return matched;
}

// ============================================================
// XLSX SUPPORT
// ============================================================

export function parseBOMFromXLSX(arrayBuffer: ArrayBuffer): ParsedBOM {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];

    if (!firstSheet) {
      return {
        rows: [],
        matched_count: 0,
        unmatched_count: 0,
        total_grams: 0,
        total_value_eur: 0,
        warnings: ["No worksheet found in uploaded Excel file"],
      };
    }

    const rows = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      blankrows: false,
      raw: false,
    }) as unknown[][];

    const normalizedRows = rows.map((row) => row.map((cell) => String(cell ?? "").trim()));
    return parseBOMFromRows(normalizedRows);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      rows: [],
      matched_count: 0,
      unmatched_count: 0,
      total_grams: 0,
      total_value_eur: 0,
      warnings: [`XLSX parsing error: ${errMsg}`],
    };
  }
}

// ============================================================
// FILE DETECTION
// ============================================================

export async function parseBOMFromFile(
  file: File,
  catalogMaterials: Array<{ name: string; id: string }>
): Promise<ParsedBOM> {
  const fileName = file.name.toLowerCase();

  try {
    let bom: ParsedBOM;
    if (fileName.endsWith(".csv")) {
      const text = await file.text();
      bom = parseBOMFromCSV(text);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      bom = parseBOMFromXLSX(buffer);
    } else {
      // Try CSV as fallback
      const text = await file.text();
      bom = parseBOMFromCSV(text);
    }

    // Match to catalog
    return matchBOMToMaterials(bom, catalogMaterials);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      rows: [],
      matched_count: 0,
      unmatched_count: 0,
      total_grams: 0,
      total_value_eur: 0,
      warnings: [`File parsing error: ${errMsg}`],
    };
  }
}
