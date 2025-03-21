import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import Employees from "@/pages/Employees";
import Clients from "@/pages/Clients";
import Vehicles from "@/pages/Vehicles";
import Services from "@/pages/Services";
import Shifts from "@/pages/Shifts";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import { AuthProvider } from "@/components/auth/AuthProvider";
import RequireAuth from "@/components/auth/RequireAuth";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Route>
      
      <Route path="/appointments">
        <RequireAuth>
          <Appointments />
        </RequireAuth>
      </Route>
      
      <Route path="/employees">
        <RequireAuth>
          <Employees />
        </RequireAuth>
      </Route>
      
      <Route path="/clients">
        <RequireAuth>
          <Clients />
        </RequireAuth>
      </Route>
      
      <Route path="/vehicles">
        <RequireAuth>
          <Vehicles />
        </RequireAuth>
      </Route>
      
      <Route path="/services">
        <RequireAuth>
          <Services />
        </RequireAuth>
      </Route>
      
      <Route path="/shifts">
        <RequireAuth>
          <Shifts />
        </RequireAuth>
      </Route>
      
      <Route path="/reports">
        <RequireAuth>
          <Reports />
        </RequireAuth>
      </Route>
      
      <Route path="/settings">
        <RequireAuth>
          <Settings />
        </RequireAuth>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
