import { NavLink, Outlet } from "react-router-dom";
import { Map, ChartNoAxesColumn, Shield, LogOut, Ghost } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { logoutPlayer } from "../services/authService";

export default function Layout() {
    const { profile, isAdmin } = useAuth();

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand"><Ghost size={28} /><span>CAÇA ÀS <strong>BRUXINHAS</strong></span></div>
                <div className="user-box"><strong>{profile?.name || "Jogador"}</strong><small>#{profile?.playerId || "—"}</small></div>
                <nav className="nav-links" aria-label="Navegação principal">
                    <NavLink to="/mapa"><Map size={19} /> Mapa das Bruxinhas</NavLink>
                    <NavLink to="/progresso"><ChartNoAxesColumn size={19} /> Meu Progresso</NavLink>
                    {isAdmin && <NavLink to="/admin"><Shield size={19} /> Administração</NavLink>}
                </nav>
                <button className="logout" onClick={logoutPlayer}><LogOut size={18} /> Sair da conta</button>
            </aside>
            <div className="main-column">
                <header className="topbar"><strong>CAÇA ÀS BRUXINHAS</strong><span>EVENTO DE HALLOWEEN</span></header>
                <Outlet />
            </div>
        </div>
    );
}
