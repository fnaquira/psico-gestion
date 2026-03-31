import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

function Router() {
  const { isAuth, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth routes — only accessible when NOT logged in */}
      <Route path="/login">
        {isAuth ? <Redirect to="/" /> : <LoginPage />}
      </Route>
      <Route path="/register">
        {isAuth ? <Redirect to="/" /> : <RegisterPage />}
      </Route>
      <Route path="/forgot-password">
        {isAuth ? <Redirect to="/" /> : <ForgotPasswordPage />}
      </Route>

      {/* Protected routes — only accessible when logged in */}
      <Route path="/">
        {isAuth ? <Home onLogout={logout} /> : <Redirect to="/login" />}
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
