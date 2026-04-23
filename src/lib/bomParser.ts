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
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z0-9\s]/g, ""); // Remove special chars
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
// CSV PARSING (simple)
// ============================================================

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let insideQuotes = false;
  let currentField = "";

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
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
      if (char === "\r" && nextChar === "\n") i++; // Skip \r\n
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

// ============================================================
// COLUMN DETECTION
// ============================================================

interface ColumnMap {
  material_name: number;
  quantity_grams: number;
  component_id?: number;
  supplier_country?: number;
  unit_cost_eur?: number;
  cas_number?: number;
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
    ],
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
  }

  // Mandatory columns
  if (map.material_name === undefined || map.quantity_grams === undefined) {
    return null;
  }

  return map;
}

// ============================================================
// BOM PARSING FUNCTION
// ============================================================

export function parseBOMFromCSV(csvText: string): ParsedBOM {
  const rows_raw = parseCSV(csvText);

  if (rows_raw.length < 2) {
    return {
      rows: [],
      matched_count: 0,
      unmatched_count: 0,
      total_grams: 0,
      total_value_eur: 0,
      warnings: ["Empty file or single row (no data rows)"],
    };
  }

  const colMap = detectColumns(rows_raw[0]);
  if (!colMap) {
    return {
      rows: [],
      matched_count: 0,
      unmatched_count: 0,
      total_grams: 0,
      total_value_eur: 0,
      warnings: [
        "Could not detect required columns (material_name, quantity_grams)",
      ],
    };
  }

  const parsedRows: BOMRow[] = [];
  let totalGrams = 0;
  let totalValue = 0;

  for (let i = 1; i < rows_raw.length; i++) {
    const row = rows_raw[i];
    const bomRow: BOMRow = {
      material_name: row[colMap.material_name] || "Unknown",
      quantity_grams: parseFloat(row[colMap.quantity_grams]) || 0,
      warnings: [],
    };

    if (colMap.component_id !== undefined) {
      bomRow.component_id = row[colMap.component_id];
    }
    if (colMap.supplier_country !== undefined) {
      bomRow.supplier_country = row[colMap.supplier_country];
    }
    if (colMap.unit_cost_eur !== undefined) {
      bomRow.unit_cost_eur = parseFloat(row[colMap.unit_cost_eur]) || 0;
    }
    if (colMap.cas_number !== undefined) {
      bomRow.cas_number = row[colMap.cas_number];
    }

    // Validation
    if (!bomRow.material_name) {
      bomRow.warnings?.push("Empty material name");
      continue;
    }

    if (bomRow.quantity_grams <= 0) {
      bomRow.warnings?.push("Invalid or missing quantity");
      continue;
    }

    totalGrams += bomRow.quantity_grams;
    totalValue += bomRow.unit_cost_eur ?? 0;

    parsedRows.push(bomRow);
  }

  return {
    rows: parsedRows,
    matched_count: 0, // Will be filled in after catalog matching
    unmatched_count: 0, // To be determined
    total_grams: Math.round(totalGrams * 100) / 100,
    total_value_eur: Math.round(totalValue * 100) / 100,
    warnings: [],
  };
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
// XLSX SUPPORT (stub — requires xlsx library)
// ============================================================

export function parseBOMFromXLSX(arrayBuffer: ArrayBuffer): ParsedBOM {
  // NOTE: Full XLSX support requires 'xlsx' library (npm install xlsx)
  // For MVP, return stub. To enable:
  //
  // import * as XLSX from 'xlsx';
  // const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  // const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // const csvText = XLSX.utils.sheet_to_csv(sheet);
  // return parseBOMFromCSV(csvText);

  return {
    rows: [],
    matched_count: 0,
    unmatched_count: 0,
    total_grams: 0,
    total_value_eur: 0,
    warnings: [
      "XLSX support not yet enabled. Please upload a CSV file or enable XLSX library in src/lib/bomParser.ts",
    ],
  };
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
    const text = await file.text();

    let bom: ParsedBOM;
    if (fileName.endsWith(".csv")) {
      bom = parseBOMFromCSV(text);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      bom = parseBOMFromXLSX(buffer);
    } else {
      // Try CSV as fallback
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
