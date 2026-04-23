import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileUp, Upload, FileText, AlertTriangle, CheckCircle2,
  X, Table as TableIcon, Info, Loader2,
} from "lucide-react";
import { BOMRiskReport } from "@/components/BOMRiskReport";
import { parseBOMFromFile } from "@/lib/bomParser";
import { analyzeBOM } from "@/lib/bomRiskEngine";
import { useData } from "@/hooks/useData";
import type { ResilienceRiskReport } from "@/lib/bomRiskEngine";

interface UploadedFile {
  name: string;
  size: number;
  rows?: number;
}

export default function BomRisk() {
  const { materials } = useData();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ResilienceRiskReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile({ name: f.name, size: f.size });
    setReport(null);
    setAnalysisError(null);
    
    // Automatically analyze on file select
    await analyzeFile(f);
  };

  const analyzeFile = async (f: File) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Convert materials to catalog format for matching
      const catalogMaterials = materials.map(m => ({
        name: m.name,
        id: m.id,
      }));

      // Parse BOM from file
      const bom = await parseBOMFromFile(f, catalogMaterials);

      if (bom.warnings.length > 0 && bom.matched_count === 0) {
        setAnalysisError(`Failed to parse BOM: ${bom.warnings[0]}`);
        setIsAnalyzing(false);
        return;
      }

      // Analyze BOM against materials
      const analysisReport = analyzeBOM(bom, materials);
      setReport(analysisReport);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAnalysisError(`Analysis error: ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sampleColumns = [
    { name: "material_name", type: "string", example: "Cobalt", required: true },
    { name: "cas_number", type: "string", example: "7440-48-4", required: false },
    { name: "quantity_grams", type: "number", example: "0.85", required: true },
    { name: "component_id", type: "string", example: "ECU-MDG1", required: true },
    { name: "supplier_country", type: "string", example: "Congo (DRC)", required: false },
    { name: "unit_cost_eur", type: "number", example: "45.00", required: false },
  ];

  // Show report if analysis succeeded
  if (report && !analysisError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">BOM Analysis Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {file?.name}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setReport(null);
              setAnalysisError(null);
            }}
          >
            Upload Different BOM
          </Button>
        </div>

        <BOMRiskReport report={report} isLoading={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">BOM & Risk Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a Bill of Materials to analyse material exposure and supply chain risk per product
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload BOM File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop zone */}
              <div
                className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
                  ${isDragging
                    ? "border-primary bg-primary/5"
                    : file
                    ? "border-success/50 bg-success/5"
                    : "border-border hover:border-primary/40 hover:bg-secondary/20"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleInputChange}
                  disabled={isAnalyzing}
                />
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-10 h-10 text-primary mb-3 animate-spin" />
                      <p className="text-sm font-semibold">Analysing BOM...</p>
                      <p className="text-xs text-muted-foreground mt-1">Matching materials and computing risk scores</p>
                    </>
                  ) : file ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-success mb-3" />
                      <p className="text-sm font-semibold text-success">File ready</p>
                      <p className="text-xs text-muted-foreground mt-1">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-10 h-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium">Drag & drop your BOM file here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                      <p className="text-[10px] text-muted-foreground mt-3">Supported formats: .CSV, .XLSX, .XLS</p>
                    </>
                  )}
                </div>
              </div>

              {analysisError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive"><strong>Error:</strong> {analysisError}</p>
                </div>
              )}

              {file && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isAnalyzing && (
                      <>
                        <Button 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => {
                            const fileInput = inputRef.current;
                            if (fileInput?.files?.[0]) {
                              analyzeFile(fileInput.files[0]);
                            }
                          }}
                        >
                          Re-analyze
                        </Button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setFile(null); 
                            setReport(null);
                            setAnalysisError(null);
                          }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expected output preview (skeleton) */}
          {!file && !report && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-muted-foreground" />
                  Analysis Output
                  <Badge variant="outline" className="text-[9px] ml-1">Preview</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {["Risk Score (0-100)", "Resilience Distance", "Critical Materials Count", "Top Risk Drivers", "Scenario Analysis (Optimistic / Base / Pessimistic)", "Per-Material Breakdown", "Recommendations"].map((item) => (
                    <div key={item} className="flex items-center gap-2 p-2 rounded-md bg-secondary/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: format guide */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Required Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Upload a CSV or Excel file with the following columns. Required columns must be present.
              </p>
              <div className="space-y-2">
                {sampleColumns.map((col) => (
                  <div key={col.name} className="flex items-start justify-between gap-2 p-2 rounded-md bg-secondary/20">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono font-medium text-foreground">{col.name}</p>
                      <p className="text-[9px] text-muted-foreground">e.g. {col.example}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-[8px] px-1 py-0">{col.type}</Badge>
                      {col.required && (
                        <span className="text-[8px] text-destructive font-medium">required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 border bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-400">Data Privacy</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    BOM files are processed locally in your browser. No data is sent to external servers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
