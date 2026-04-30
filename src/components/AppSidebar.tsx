import {
  LayoutDashboard, Database, Cpu, Zap,
  DollarSign, LogOut, Settings, Target,
  FlaskConical, FileUp, Globe, Hexagon, Rocket, Bell,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";

const analyticNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "CRM Materials", url: "/materials", icon: Database },
  { title: "BOM & Risk", url: "/bom", icon: FileUp },
];

const operativeNav = [
  { title: "ECU Inventory", url: "/ecu", icon: Cpu },
  { title: "Decision Engine", url: "/decision-engine", icon: Zap },
  { title: "Simulation", url: "/simulation", icon: FlaskConical },
];

const strategicNav = [
  { title: "Executive Dashboard", url: "/executive", icon: Globe },
  { title: "Investor Demo", url: "/investor-demo", icon: Rocket },
  { title: "Financial Engine", url: "/financial", icon: DollarSign },
  { title: "HaaS Readiness", url: "/haas", icon: Target },
  { title: "Alert History", url: "/alerts", icon: Bell },
];

const layers = [
  { label: "Analytics", items: analyticNav },
  { label: "Operations", items: operativeNav },
  { label: "Strategy", items: strategicNav },
];

export function AppSidebar() {
  const { user, signOut, roles } = useAuth();

  // Refresh health: query last data_refresh_log row to show status dot
  const { data: lastRefresh } = useQuery({
    queryKey: ["sidebar-refresh-health"],
    queryFn: async () => {
      const { data } = await supabase
        .from("data_refresh_log")
        .select("status, finished_at")
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const refreshDotColor =
    lastRefresh == null ? "bg-muted-foreground/30"
    : lastRefresh.status === "error" ? "bg-destructive animate-pulse"
    : lastRefresh.status === "warning" ? "bg-accent"
    : "bg-green-500";

  const refreshDotTitle =
    lastRefresh == null ? "No refresh data"
    : `Last refresh: ${lastRefresh.status} (${new Date(lastRefresh.finished_at).toLocaleString("en-US")})`;

  return (
    <Sidebar className="border-r border-border/50">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Hexagon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-gradient-cyan">TraceTech</h2>
            <p className="text-[10px] text-muted-foreground leading-tight">CRM Intelligence</p>
          </div>
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${refreshDotColor}`}
            title={refreshDotTitle}
          />
        </div>
      </div>

      <SidebarContent>
        {layers.map((layer) => (
          <SidebarGroup key={layer.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              {layer.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {layer.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="hover:bg-secondary/50 transition-colors"
                        activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
                      >
                        <item.icon className="w-4 h-4 mr-3 shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {roles.includes("admin") && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/settings" className="hover:bg-secondary/50 transition-colors" activeClassName="bg-primary/10 text-primary">
                      <Settings className="w-4 h-4 mr-3 shrink-0" />
                      <span className="text-sm">Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{roles[0] || "analyst"}</p>
          </div>
          <button onClick={signOut} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
