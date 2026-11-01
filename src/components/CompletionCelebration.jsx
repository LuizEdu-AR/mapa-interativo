import { useEffect, useRef } from "react";
import { Sparkles, Trophy, X } from "lucide-react";
import "./CompletionCelebration.css";

const confetti = Array.from({ length: 72 }, (_, index) => ({
    left: `${(index * 37.7) % 100}%`,
    delay: `${((index * 17) % 32) / 10}s`,
    duration: `${3.5 + ((index * 7) % 25) / 10}s`,
    color: ["#aa45ed", "#f06bc6", "#16101f", "#d5a0ff"][index % 4],
    rotation: `${(index * 71) % 360}deg`
}));

export default function CompletionCelebration({ onClose }) {
    const musicRef = useRef(null);

    useEffect(() => {
        const music = musicRef.current;
        if (!music) return;
        music.volume = 0.65;
        // Iniciado pela interação que abre a comemoração. Alguns navegadores
        // podem bloquear autoplay com áudio; não contornamos essa preferência.
        const attempt = music.play();
        if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
        return () => { music.pause(); music.currentTime = 0; };
    }, []);

    useEffect(() => {
        const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="celebration-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <audio ref={musicRef} src="/comemoracao-halloween.mp3" autoPlay loop preload="auto" />
            <div className="celebration-confetti" aria-hidden="true">
                {confetti.map((piece, index) => <i key={index} style={{ "--left": piece.left, "--delay": piece.delay, "--duration": piece.duration, "--color": piece.color, "--rotation": piece.rotation }} />)}
            </div>
            <section className="celebration-content" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
                <button type="button" className="celebration-close" onClick={onClose} aria-label="Fechar comemoração"><X size={22} /></button>
                <div className="celebration-award"><Trophy size={17} /> CONQUISTA LENDÁRIA <Sparkles size={17} /></div>
                <div className="celebration-witch" aria-hidden="true">
                    <video src="/bruxinha_coleta.webm" autoPlay muted loop playsInline preload="metadata" disablePictureInPicture />
                </div>
                <p className="celebration-kicker">A CAÇADA FOI CONCLUÍDA!</p>
                <h2 id="celebration-title">PARABÉNS!</h2>
                <p className="celebration-message">Você encontrou todas as <strong>100 bruxinhas</strong> espalhadas pela cidade!</p>
                <div className="celebration-score"><strong>100/100</strong><span>COLEÇÃO COMPLETA</span></div>
                <p className="celebration-footer">Cada descoberta fez parte dessa aventura. Você conquistou seu lugar entre os grandes caçadores da Rua 2!</p>
                <button type="button" className="celebration-action" onClick={onClose}>Continuar explorando</button>
            </section>
        </div>
    );
}
