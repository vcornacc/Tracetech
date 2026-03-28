import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  User, Shield, Bell, Database, Info, Hexagon, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotifSettings {
  criticalRisk: boolean;
  priceVolatility: boolean;
  recoveryMilestones: boolean;
  weeklyDigest: boolean;
}

interface SecuritySettings {
  twoFactor: boolean;
  sessionTimeout: string;
  apiAccess: boolean;
}

export default function Settings() {
  const { user, roles } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<NotifSettings>({
    criticalRisk: true,
    priceVolatility: true,
    recoveryMilestones: false,
    weeklyDigest: false,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactor: false,
    sessionTimeout: "8 hours",
    apiAccess: true,
  });

  const toggleNotif = useCallback((key: keyof NotifSettings) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast({ title: `${key} ${next[key] ? "enabled" : "disabled"}`, description: "Notification preference saved." });
      return next;
    });
  }, [toast]);

  const toggleSecurity = useCallback((key: keyof SecuritySettings) => {
    if (key === "twoFactor") {
      setSecurity((prev) => {
        const next = { ...prev, twoFactor: !prev.twoFactor };
        toast({ title: `2FA ${next.twoFactor ? "enabled" : "disabled"}`, description: next.twoFactor ? "Two-factor authentication activated." : "Two-factor authentication deactivated." });
        return next;
      });
    } else if (key === "apiAccess") {
      setSecurity((prev) => {
        const next = { ...prev, apiAccess: !prev.apiAccess };
        toast({ title: `API access ${next.apiAccess ? "enabled" : "disabled"}` });
        return next;
      });
    }
  }, [toast]);

  const resetDefaults = useCallback(() => {
    setNotifications({ criticalRisk: true, priceVolatility: true, recoveryMilestones: false, weeklyDigest: false });
    setSecurity({ twoFactor: false, sessionTimeout: "8 hours", apiAccess: true });
    toast({ title: "Settings reset", description: "All preferences restored to defaults." });
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform configuration and account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Account */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
              </div>
              <p className="text-xs font-medium font-mono">{user?.email ?? "—"}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Role</p>
              <div className="flex flex-wrap gap-1.5">
                {roles.length > 0 ? roles.map((r) => (
                  <Badge key={r} variant="outline" className="text-[9px] capitalize bg-primary/10 text-primary border-primary/30">
                    {r}
                  </Badge>
                )) : (
                  <Badge variant="outline" className="text-[9px] bg-secondary text-muted-foreground">analyst</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "Two-factor authentication", key: "twoFactor" as const, getValue: () => security.twoFactor },
              { label: "API access", key: "apiAccess" as const, getValue: () => security.apiAccess },
            ]).map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => toggleSecurity(item.key)}
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <Badge
                  variant="outline"
                  className={`text-[9px] ${item.getValue() ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}
                >
                  {item.getValue() ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-muted-foreground">Session timeout</p>
              <Badge variant="outline" className="text-[9px] bg-success/10 text-success border-success/30">{security.sessionTimeout}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "Critical risk alerts", key: "criticalRisk" as const },
              { label: "Price volatility triggers", key: "priceVolatility" as const },
              { label: "Recovery milestones", key: "recoveryMilestones" as const },
              { label: "Weekly digest", key: "weeklyDigest" as const },
            ]).map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => toggleNotif(item.key)}
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <div className={`w-7 h-4 rounded-full transition-colors ${notifications[item.key] ? "bg-primary" : "bg-border"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${notifications[item.key] ? "translate-x-3.5" : "translate-x-0.5"}`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Data sources */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: "Supabase CRM DB", status: "Connected", desc: "Materials and ECU data" },
              { name: "Yale Criticality Index", status: "v2024", desc: "Risk scoring engine" },
              { name: "EU CRM Classification", status: "2023 List", desc: "Strategic materials registry" },
            ].map((src) => (
              <div key={src.name} className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-medium">{src.name}</p>
                  <Badge variant="outline" className="text-[8px] shrink-0 bg-success/10 text-success border-success/30">{src.status}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{src.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">TraceTech v1.0</p>
              <p className="text-[10px] text-muted-foreground">CRM Intelligence Platform · © 2026</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={resetDefaults}>
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </Button>
              <Badge variant="outline" className="text-[9px] bg-success/10 text-success border-success/30">
                <Info className="w-2.5 h-2.5 mr-1" />
                Up to date
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
