import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useData } from "@/hooks/useData";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/materials": "CRM Materials",
  "/bom": "BOM & Risk",
  "/ecu": "ECU Inventory",
  "/decision-engine": "Decision Engine",
  "/simulation": "Simulation",
  "/executive": "Executive Dashboard",
  "/financial": "Financial Engine",
  "/haas": "HaaS Readiness",
  "/settings": "Settings",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { circularTriggers, triggersLoading } = useData();
  const activeTriggers = circularTriggers.filter(
    (trigger) => trigger.status === "active" || trigger.status === "monitoring"
  );

  const currentLabel =
    routeLabels[location.pathname] ??
    Object.entries(routeLabels).find(
      ([key]) => location.pathname.startsWith(key) && key !== "/"
    )?.[1] ??
    "TraceTech";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
              <nav className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">TraceTech</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-foreground font-medium">{currentLabel}</span>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-md hover:bg-secondary transition-colors relative">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    {activeTriggers.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-[9px] leading-4 text-primary-foreground text-center font-semibold">
                        {Math.min(activeTriggers.length, 9)}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Active notifications</SheetTitle>
                    <SheetDescription>
                      Live triggers from the circular monitoring engine.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1">
                    {triggersLoading && (
                      <p className="text-sm text-muted-foreground">Loading notifications...</p>
                    )}

                    {!triggersLoading && activeTriggers.length === 0 && (
                      <p className="text-sm text-muted-foreground">No active notifications.</p>
                    )}

                    {!triggersLoading &&
                      activeTriggers.map((trigger) => (
                        <div
                          key={trigger.id}
                          className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">{trigger.label}</p>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {trigger.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{trigger.description}</p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Affected ECUs: {trigger.affectedECUs}</span>
                            <span>{new Date(trigger.timestamp).toLocaleDateString("en-US")}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
