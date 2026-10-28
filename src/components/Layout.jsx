import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Map, ChartNoAxesColumn, Shield, LogOut, Ghost } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { logoutPlayer } from "../services/authService";

export default function Layout() {
    const { profile, isAdmin } = useAuth();
    const [confirmLogout, setConfirmLogout] = useState(false);

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
                <button className="logout" onClick={() => setConfirmLogout(true)}><LogOut size={18} /> Sair da conta</button>
            </aside>
            <div className="main-column">
                <header className="topbar"><strong>CAÇA ÀS BRUXINHAS</strong><span>EVENTO DE HALLOWEEN</span></header>
                <div className="main-content"><Outlet /></div>
                <footer className="site-footer"><span>© 2026 — Desenvolvido por <strong>Luiz Eduardo “LORE N | CHICO”</strong></span><span className="footer-support">Com apoio da fraternidade <strong>Villains</strong><img src="/villains-logo.png" alt="Logo da fraternidade Villains" /></span></footer>
            </div>
            {confirmLogout && <div className="modal-backdrop" onClick={() => setConfirmLogout(false)}><section className="modal confirm-modal" role="dialog" aria-modal="true" aria-label="Confirmar saída" onClick={(event) => event.stopPropagation()}><h2>Sair da conta?</h2><p>Seu progresso continuará salvo na sua conta.</p><div className="confirm-actions"><button className="button secondary" onClick={() => setConfirmLogout(false)}>Cancelar</button><button className="button primary" onClick={logoutPlayer}>Sair da conta</button></div></section></div>}
        </div>
    );
}
