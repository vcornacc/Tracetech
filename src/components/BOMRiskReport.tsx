import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
} from "recharts";
import type { ResilienceRiskReport } from "@/lib/bomRiskEngine";

interface BOMRiskReportProps {
  report: ResilienceRiskReport;
  isLoading?: boolean;
}

export function BOMRiskReport({ report, isLoading }: BOMRiskReportProps) {
  const getRiskColor = (score: number) => {
    if (score >= 75) return "#ef4444"; // red-500
    if (score >= 55) return "#f97316"; // orange-500
    if (score >= 35) return "#eab308"; // yellow-500
    return "#22c55e"; // green-500
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 75) return "bg-red-50";
    if (score >= 55) return "bg-orange-50";
    if (score >= 35) return "bg-yellow-50";
    return "bg-green-50";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 75) return "CRITICAL";
    if (score >= 55) return "HIGH";
    if (score >= 35) return "MEDIUM";
    return "LOW";
  };

  const scenarioData = useMemo(() => {
    return report.scenarios.map((s) => ({
      name: s.scenario.label,
      riskScore: s.totalRiskScore,
      distance: s.resilienceDistance,
    }));
  }, [report.scenarios]);

  const materialsChartData = useMemo(() => {
    return report.materials.slice(0, 10).map((m) => ({
      name: m.material_name.substring(0, 12),
      mrf: m.mrfScore,
      share: m.share_of_bom_percent,
    }));
  }, [report.materials]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className={getRiskBgColor(report.totalRiskScore)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resilience Risk Report</span>
            <Badge
              className="text-lg"
              style={{ backgroundColor: getRiskColor(report.totalRiskScore) }}
            >
              {getRiskLabel(report.totalRiskScore)}
            </Badge>
          </CardTitle>
          <CardDescription>{report.timestamp}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Risk Score</div>
              <div className="text-3xl font-bold" style={{ color: getRiskColor(report.totalRiskScore) }}>
                {report.totalRiskScore}
                <span className="text-lg">/100</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Resilience Distance</div>
              <div className="text-3xl font-bold text-orange-600">
                {report.resilienceDistance.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Target: &lt;35</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Critical Materials</div>
              <div className="text-3xl font-bold text-red-600">
                {report.criticalMaterialsCount}
              </div>
              <div className="text-xs text-gray-500">
                of {report.matched_materials}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Matched Materials</div>
              <div className="text-3xl font-bold text-blue-600">
                {report.matched_materials}
                <span className="text-lg">/</span>
                {report.total_materials}
              </div>
            </div>
          </div>

          {/* Resilience Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Resilience Level</span>
              <span className="text-xs text-gray-500">
                {report.resilientBOM ? "✅ RESILIENT" : "❌ NOT RESILIENT"}
              </span>
            </div>
            <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(100, (report.totalRiskScore / 100) * 100)}%`,
                  backgroundColor: getRiskColor(report.totalRiskScore),
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low Risk (0)</span>
              <span>Threshold (35)</span>
              <span>Critical (100)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings & Insights */}
      {report.warnings.length > 0 && (
        <div className="space-y-2">
          {report.warnings.map((w, idx) => (
            <Alert key={idx} variant={idx === 0 ? "destructive" : "default"}>
              <AlertDescription>{w}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {report.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.insights.map((insight, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-lg">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Scenario Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
          <CardDescription>
            Risk score projections under different supply chain conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="riskScore" fill="#8884d8" name="Risk Score" radius={[8, 8, 0, 0]} />
              <Bar dataKey="distance" fill="#ffc658" name="Resilience Distance" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Scenario Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {report.scenarios.map((s) => (
              <Card key={s.scenario.name} className="border">
                <CardHeader>
                  <CardTitle className="text-base">{s.scenario.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-600">Risk Score</div>
                    <div className="text-2xl font-bold" style={{ color: getRiskColor(s.totalRiskScore) }}>
                      {s.totalRiskScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Critical Materials</div>
                    <div className="text-lg font-semibold">{s.criticalMaterialCount}</div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                    {s.scenario.keyAssumptions.slice(0, 2).map((a, i) => (
                      <div key={i}>• {a}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Risk Drivers */}
      {report.topRiskDrivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Risk Drivers</CardTitle>
            <CardDescription>
              Main factors affecting BOM resilience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.topRiskDrivers.map((driver, idx) => (
              <div key={idx} className="border-l-4 border-orange-400 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{driver.driver}</h4>
                  <Badge variant="outline">
                    {driver.affectedMaterials.length} materials
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  📋 {driver.mitigation}
                </p>
                <div className="flex flex-wrap gap-1">
                  {driver.affectedMaterials.slice(0, 5).map((m) => (
                    <Badge key={m.material_id} variant="secondary" className="text-xs">
                      {m.material_name}
                    </Badge>
                  ))}
                  {driver.affectedMaterials.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{driver.affectedMaterials.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Material Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Material Breakdown (Top 10 by Risk)</CardTitle>
          <CardDescription>
            Detailed risk analysis for each material in the BOM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.materials.slice(0, 10).map((mat, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{mat.material_name}</h4>
                  <div className="text-xs text-gray-500">
                    {mat.quantity_grams.toFixed(2)}g ({mat.share_of_bom_percent.toFixed(1)}% of BOM)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: getRiskColor(mat.mrfScore) }}>
                    {mat.mrfScore}
                  </div>
                  <Badge className={`text-xs ${mat.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : ''}`}>
                    {mat.riskLevel.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Match Score:</span>
                  <span className="font-semibold ml-1">{mat.matched_score}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Resilience Dist.:</span>
                  <span className="font-semibold ml-1">{mat.resilienceDistance.toFixed(1)}</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">Top Drivers:</div>
                <div className="flex flex-wrap gap-1">
                  {mat.drivers.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>

              {mat.recommendations.length > 0 && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">Recommendations:</div>
                  <ul className="text-xs space-y-1">
                    {mat.recommendations.slice(0, 2).map((r, i) => (
                      <li key={i}>✓ {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Data Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total BOM Weight</span>
            <div className="font-semibold">{report.total_bom_grams.toFixed(0)}g</div>
          </div>
          <div>
            <span className="text-gray-600">Estimated Value</span>
            <div className="font-semibold">€{report.total_bom_value_eur.toFixed(0)}</div>
          </div>
          <div>
            <span className="text-gray-600">Matched Materials</span>
            <div className="font-semibold">
              {report.matched_materials}/{report.total_materials}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Analysis Confidence</span>
            <div className="font-semibold">
              {report.matched_materials > 0
                ? ((report.matched_materials / report.total_materials) * 100).toFixed(0)
                : 0}
              %
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
