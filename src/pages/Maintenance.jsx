export default function Maintenance() {
    return <main className="maintenance-page">
        <section className="maintenance-card">
            <video
                    src="/bruxinha_coleta.webm"
                    className="maintenance-witch"
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                />
            <span className="eyebrow">CAÇA ÀS BRUXINHAS · RUA 2</span>
            <h1>Estamos preparando a próxima caçada!</h1>
            <p>O mapa está temporariamente em manutenção para melhorar sua experiência. Seus pontos e progresso estão preservados.</p>
            <div className="maintenance-status">Manutenção temporária</div>
        </section>
    </main>;
}
