import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import AdminPanelPage from "./pages/AdminPanelPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

function Router() {
  const { isAuth, loading, user, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isSuperAdmin = isAuth && user?.rol === "superadmin";

  return (
    <Switch>
      {/* Auth routes — redirect to correct home based on role */}
      <Route path="/login">
        {!isAuth ? <LoginPage /> : isSuperAdmin ? <Redirect to="/admin" /> : <Redirect to="/" />}
      </Route>
      <Route path="/register">
        {isAuth ? <Redirect to="/" /> : <RegisterPage />}
      </Route>
      <Route path="/forgot-password">
        {isAuth ? <Redirect to="/" /> : <ForgotPasswordPage />}
      </Route>

      {/* Superadmin panel */}
      <Route path="/admin">
        {!isAuth ? <Redirect to="/login" /> : !isSuperAdmin ? <Redirect to="/" /> : <AdminPanelPage onLogout={logout} />}
      </Route>

      {/* Regular app — superadmin redirected to /admin */}
      <Route path="/">
        {!isAuth ? <Redirect to="/login" /> : isSuperAdmin ? <Redirect to="/admin" /> : <Home onLogout={logout} />}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
