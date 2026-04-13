import { FormEvent, useMemo, useState } from "react";
import { authSessionPreferences, getAuthEmailRedirectUrl, supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Hexagon, Shield, BarChart3, Recycle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "signin" | "signup";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(authSessionPreferences.getRememberMe());
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showInlineResendForSignin, setShowInlineResendForSignin] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isLogin = mode === "signin";

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        errors.fullName = "Full name is required.";
      } else if (fullName.trim().length < 2) {
        errors.fullName = "Full name must be at least 2 characters.";
      }
    }

    return errors;
  }, [email, password, fullName, isLogin]);

  const canSubmit = Object.keys(fieldErrors).length === 0;

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError(null);
    setShowInlineResendForSignin(false);
    setPendingVerificationEmail(null);
    setFieldTouched({});
  };

  const handleResendVerification = async () => {
    const destinationEmail = pendingVerificationEmail ?? email;
    if (!destinationEmail) return;

    setResendingEmail(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: destinationEmail,
      options: {
        emailRedirectTo: getAuthEmailRedirectUrl(),
      },
    });
    setResendingEmail(false);

    if (error) {
      toast({ title: "Unable to resend email", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Verification email sent",
      description: `We sent a new verification email to ${destinationEmail}.`,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setFieldTouched({ fullName: true, email: true, password: true });
    setFormError(null);
    setShowInlineResendForSignin(false);
    if (!canSubmit) return;

    setLoading(true);

    if (isLogin) {
      authSessionPreferences.setRememberMe(rememberMe);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const hasUnconfirmedEmail = error.message.toLowerCase().includes("email not confirmed");
        const authMessage = hasUnconfirmedEmail
          ? "Your account is not verified yet. Check your inbox and confirm your email before signing in."
          : error.message;
        if (hasUnconfirmedEmail) {
          setShowInlineResendForSignin(true);
        }
        setFormError(authMessage);
        toast({ title: "Sign-in error", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: getAuthEmailRedirectUrl(),
        },
      });
      if (error) {
        setFormError(error.message);
        toast({ title: "Registration error", description: error.message, variant: "destructive" });
      } else {
        setPendingVerificationEmail(email);
        toast({
          title: "Registration complete",
          description: "A confirmation email has been sent. Verify your account to complete sign up.",
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 bg-card border-r border-border/50 relative overflow-hidden">
        {/* Decorative background grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, hsl(186 90% 42%) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-gradient-cyan">TraceTech</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-foreground mb-4">
            Critical Raw Materials<br />Intelligence Platform
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            Monitor, analyse and mitigate supply chain risks for critical raw materials across your ECU portfolio.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: Shield, label: "Risk Monitoring", desc: "Yale Score, EU CRM classification, HHI tracking" },
              { icon: BarChart3, label: "Financial Engine", desc: "NPV, IRR, payback and geopolitical stress tests" },
              { icon: Recycle, label: "Circular Readiness", desc: "ECU lifecycle tracking and HaaS transition score" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[10px] text-muted-foreground/50">© 2026 TraceTech · Circular Governance Platform</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Hexagon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-base font-bold text-gradient-cyan">TraceTech</span>
          </div>

          <div>
            <div className="rounded-lg border border-border/70 p-1 mb-4 grid grid-cols-2 gap-1 bg-secondary/30">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={isLogin}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  !isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={!isLogin}
              >
                Sign up
              </button>
            </div>

            <h2 className="text-2xl font-bold">{isLogin ? "Sign in" : "Create account"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? "Enter your credentials to access the platform" : "Create your account and verify your email"}
            </p>
          </div>

          {pendingVerificationEmail && !isLogin ? (
            <div className="space-y-5 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div>
                <h3 className="font-semibold text-base">Verify your email</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a confirmation link to <span className="text-foreground font-medium">{pendingVerificationEmail}</span>.
                  Open the email and verify your account, then return here to sign in.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendingEmail}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
              >
                {resendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Resend verification email
              </button>
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="w-full py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setFieldTouched((prev) => ({ ...prev, fullName: true }))}
                    autoComplete="name"
                    required
                    aria-invalid={Boolean(fieldTouched.fullName && fieldErrors.fullName)}
                    aria-describedby={fieldTouched.fullName && fieldErrors.fullName ? "fullName-error" : undefined}
                    className="h-11 bg-secondary/50"
                  />
                  {fieldTouched.fullName && fieldErrors.fullName && (
                    <p id="fullName-error" className="text-xs text-destructive" role="alert">{fieldErrors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setFieldTouched((prev) => ({ ...prev, email: true }))}
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(fieldTouched.email && fieldErrors.email)}
                  aria-describedby={fieldTouched.email && fieldErrors.email ? "email-error" : undefined}
                  className="h-11 bg-secondary/50"
                />
                {fieldTouched.email && fieldErrors.email && (
                  <p id="email-error" className="text-xs text-destructive" role="alert">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setFieldTouched((prev) => ({ ...prev, password: true }))}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  aria-invalid={Boolean(fieldTouched.password && fieldErrors.password)}
                  aria-describedby={fieldTouched.password && fieldErrors.password ? "password-error" : "password-help"}
                  className="h-11 bg-secondary/50"
                />
                <p id="password-help" className="text-xs text-muted-foreground">
                  Use a strong password with at least 8 characters.
                </p>
                {fieldTouched.password && fieldErrors.password && (
                  <p id="password-error" className="text-xs text-destructive" role="alert">{fieldErrors.password}</p>
                )}
              </div>

              {isLogin && (
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    aria-label="Keep me signed in"
                  />
                  <Label htmlFor="remember-me" className="text-sm text-muted-foreground">Keep me signed in</Label>
                </div>
              )}

              {formError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  <p>{formError}</p>
                  {isLogin && showInlineResendForSignin && emailRegex.test(email) && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingEmail}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:no-underline disabled:opacity-60"
                    >
                      {resendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Resend verification email
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {isLogin ? "Sign in" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
