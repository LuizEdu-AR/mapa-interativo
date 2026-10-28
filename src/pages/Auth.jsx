import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginPlayer, registerPlayer } from "../services/authService";

export default function AuthPage({ register = false }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ id: "", name: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (register) {
                await registerPlayer(form);
            } else {
                await loginPlayer(form.id, form.password);
            }
            navigate("/mapa", { replace: true });
        } catch (caught) {
            setError(caught.message || "Não foi possível autenticar.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-container">
            <section className="auth-card">
                <div className="auth-symbol">✦</div>
                <span className="eyebrow">EVENTO DE HALLOWEEN</span>
                <h1>Caça às Bruxinhas</h1>
                <p>{register ? "Crie sua conta e acompanhe sua coleção." : "Entre para continuar sua caçada."}</p>
                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="id">ID do personagem</label>
                    <input id="id" name="id" value={form.id} onChange={handleChange} inputMode="numeric" required disabled={loading} placeholder="Ex.: 194" />
                    {register && (
                        <>
                            <label htmlFor="name">Nome do personagem</label>
                            <input id="name" name="name" value={form.name} onChange={handleChange} maxLength={32} required disabled={loading} placeholder="Nome e sobrenome" />
                        </>
                    )}
                    <label htmlFor="password">Senha</label>
                    <input id="password" name="password" type="password" minLength={register ? 8 : undefined} value={form.password} onChange={handleChange} required disabled={loading} placeholder="Sua senha" />
                    {error && <div className="message error" role="alert">{error}</div>}
                    <button className="button primary" type="submit" disabled={loading}>{loading ? "Aguarde..." : register ? "Criar conta" : "Entrar"}</button>
                </form>
                <div className="auth-footer">
                    {register ? "Já possui conta?" : "Ainda não possui conta?"}{" "}
                    <Link to={register ? "/login" : "/cadastro"}>{register ? "Fazer login" : "Cadastrar-se"}</Link>
                </div>
            </section>
        </main>
    );
}
