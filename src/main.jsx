import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";

const root = createRoot(document.getElementById("root"));
// Fechado por padrão: nenhum SDK Firebase é importado enquanto em manutenção.
// Para reabrir, configure VITE_MAINTENANCE_MODE=false e faça novo deploy.
if (import.meta.env.VITE_MAINTENANCE_MODE !== "false") {
    import("./pages/Maintenance.jsx").then(({ default: Maintenance }) => root.render(<Maintenance />));
} else {
    Promise.all([import("react-router-dom"), import("./contexts/AuthContext"), import("./App")])
        .then(([{ BrowserRouter }, { AuthProvider }, { default: App }]) => {
            root.render(<React.StrictMode><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></React.StrictMode>);
        });
}
