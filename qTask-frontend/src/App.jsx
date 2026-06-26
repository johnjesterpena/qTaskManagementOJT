import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import LoginPage from "./components/auth/LoginPage";
import { useAuth } from "./context/useAuth";
import { getDefaultPage, getNavItems } from "./config/navigation";

export default function App() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return <LoginPage />;

  const defaultPage = getDefaultPage(currentUser.role);
  const validKeys = getNavItems(currentUser.role).map((i) => i.key);

  return (
    <Routes>
      {/* Redirect root to the role's default page */}
      <Route path="/" element={<Navigate to={`/${defaultPage}`} replace />} />

      {/* All valid pages for this role */}
      {validKeys.map((key) => (
        <Route
          key={key}
          path={`/${key}`}
          element={<AppShell currentUser={currentUser} logout={logout} />}
        />
      ))}

      {/* Catch-all — redirect unknown paths to default */}
      <Route path="*" element={<Navigate to={`/${defaultPage}`} replace />} />
    </Routes>
  );
}
