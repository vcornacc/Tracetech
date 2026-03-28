import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileUp, Upload, FileText, AlertTriangle, CheckCircle2,
  X, Table as TableIcon, Info,
} from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  rows?: number;
}

export default function BomRisk() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile({ name: f.name, size: f.size });
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
                />
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  {file ? (
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
                    <Button size="sm" className="h-7 text-xs">
                      Analyse BOM
                    </Button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expected output preview (skeleton) */}
          {!file && (
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
                  {["Risk exposure per material", "Cluster assignment (Systemic / Product / Sectoral / Operational)", "Supply chain concentration (HHI)", "Geopolitical dependency map", "Circular recovery potential (€)"].map((item) => (
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
