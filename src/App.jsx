import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/Auth";
import Layout from "./components/Layout";
import MapPage from "./pages/MapPage";
import AdminPage from "./pages/AdminPage";

function Protected({ children, admin = false }) {
    const { user, profile, loading, isAdmin } = useAuth();
    if (loading) return <div className="loading-screen">Carregando sua caçada...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (!profile) return <div className="loading-screen">Perfil indisponível. Entre em contato com a administração.</div>;
    if (admin && !isAdmin) return <Navigate to="/mapa" replace />;
    return children;
}

function Guest({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen">Carregando...</div>;
    return user ? <Navigate to="/mapa" replace /> : children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Guest><AuthPage /></Guest>} />
            <Route path="/cadastro" element={<Guest><AuthPage register /></Guest>} />
            <Route element={<Protected><Layout /></Protected>}>
                <Route path="/mapa" element={<MapPage />} />
                <Route path="/progresso" element={<MapPage progressOnly />} />
                <Route path="/admin" element={<Protected admin><AdminPage /></Protected>} />
            </Route>
            <Route path="*" element={<Navigate to="/mapa" replace />} />
        </Routes>
    );
}
