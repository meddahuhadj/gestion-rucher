import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useWorkspace } from './context/WorkspaceContext';
import { Layout } from './components/layout/Layout';
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';
import { WorkspacePage } from './pages/workspace/WorkspacePage';
import { Dashboard } from './pages/Dashboard';
import { ApiariesList } from './pages/apiaries/ApiariesList';
import { ApiaryDetail } from './pages/apiaries/ApiaryDetail';
import { HivesList } from './pages/hives/HivesList';
import { HiveDetail } from './pages/hives/HiveDetail';
import { HiveFormPage } from './pages/hives/HiveFormPage';
import { InspectionsList } from './pages/inspections/InspectionsList';
import { InspectionDetail } from './pages/inspections/InspectionDetail';
import { InspectionForm } from './pages/inspections/InspectionForm';
import { TasksList } from './pages/tasks/TasksList';
import { QueensList } from './pages/queens/QueensList';
import { HarvestsList } from './pages/harvests/HarvestsList';
import { FinancesOverview } from './pages/finances/FinancesOverview';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { StatisticsPage } from './pages/statistics/StatisticsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { Spinner } from './components/ui';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const WorkspaceRoute = ({ children }) => {
  const { workspaces, loading } = useWorkspace();
  if (!loading && workspaces.length === 0) return <Navigate to="/workspace" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/workspace" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><WorkspaceRoute><Layout /></WorkspaceRoute></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/apiaries" element={<ApiariesList />} />
        <Route path="/apiaries/:id" element={<ApiaryDetail />} />
        <Route path="/hives" element={<HivesList />} />
        <Route path="/hives/new" element={<HiveFormPage />} />
        <Route path="/hives/:id" element={<HiveDetail />} />
        <Route path="/hives/:id/edit" element={<HiveFormPage />} />
        <Route path="/inspections" element={<InspectionsList />} />
        <Route path="/inspections/new" element={<InspectionForm />} />
        <Route path="/inspections/:id" element={<InspectionDetail />} />
        <Route path="/inspections/:id/edit" element={<InspectionForm />} />
        <Route path="/tasks" element={<TasksList />} />
        <Route path="/queens" element={<QueensList />} />
        <Route path="/harvests" element={<HarvestsList />} />
        <Route path="/finances" element={<FinancesOverview />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return <AppRoutes />;
}
