import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { useState } from "react";

function Router({ isAuth, onLogin, onLogout }: { isAuth: boolean; onLogin: () => void; onLogout: () => void }) {
  return (
    <Switch>
      {/* Auth routes — only accessible when NOT logged in */}
      <Route path="/login">
        {isAuth ? <Redirect to="/" /> : <LoginPage onLogin={onLogin} />}
      </Route>
      <Route path="/register">
        {isAuth ? <Redirect to="/" /> : <RegisterPage onLogin={onLogin} />}
      </Route>
      <Route path="/forgot-password">
        {isAuth ? <Redirect to="/" /> : <ForgotPasswordPage />}
      </Route>

      {/* Protected routes — only accessible when logged in */}
      <Route path="/">
        {isAuth ? <Home onLogout={onLogout} /> : <Redirect to="/login" />}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuth, setIsAuth] = useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router
            isAuth={isAuth}
            onLogin={() => setIsAuth(true)}
            onLogout={() => setIsAuth(false)}
          />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
