import {
  LayoutDashboard, Database, Cpu, Zap, Recycle,
  DollarSign, LogOut, Settings, BarChart3, Target,
  FlaskConical, FileUp, Globe,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import boschLogo from "@/assets/bosch-logo.png";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";

const analyticNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Materiali CRM", url: "/materials", icon: Database },
  { title: "BOM & Risk", url: "/bom", icon: FileUp },
];

const operativeNav = [
  { title: "Inventario ECU", url: "/ecu", icon: Cpu },
  { title: "Decision Engine", url: "/decision-engine", icon: Zap },
  { title: "Simulazione", url: "/simulation", icon: FlaskConical },
];

const strategicNav = [
  { title: "Executive Dashboard", url: "/executive", icon: Globe },
  { title: "Motore Finanziario", url: "/financial", icon: DollarSign },
  { title: "HaaS Readiness", url: "/haas", icon: Target },
];

const layers = [
  { label: "Layer Analitico", items: analyticNav },
  { label: "Layer Operativo", items: operativeNav },
  { label: "Layer Strategico", items: strategicNav },
];

export function AppSidebar() {
  const { user, signOut, roles } = useAuth();

  return (
    <Sidebar className="border-r border-border/50">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src={boschLogo} alt="Bosch" className="h-7 brightness-0 invert opacity-90" />
          <div className="h-5 w-px bg-border" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-gradient-cyan">BCDP</h2>
            <p className="text-[10px] text-muted-foreground leading-tight">Circular Digital Platform</p>
          </div>
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
                      <span className="text-sm">Impostazioni</span>
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
