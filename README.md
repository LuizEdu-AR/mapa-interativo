# Caça às Bruxinhas — Pacote inicial do mapa

## Conteúdo

- `public/maps/tiles/`: tiles WebP de 512 × 512, níveis 0 a 2.
- `public/maps/map-info.json`: dimensões verificadas do arquivo enviado.
- `src/components/Map/GameMap.jsx`: componente React + Leaflet.
- `src/components/Map/GameMap.css`: estilos do mapa e marcadores.

## Instalação

No projeto React/Vite, execute `npm install leaflet` e copie as pastas `public` e `src` deste pacote para o projeto.

Exemplo:

```jsx
import GameMap from "./components/Map/GameMap";

<GameMap
    points={[{ id: 1, x: 0.5, y: 0.6, difficulty: "easy" }]}
    selectionMode={false}
    onMapSelect={(coords) => console.log(coords)}
    onPointClick={(point) => console.log(point)}
/>
```

O elemento pai precisa ter altura definida. `selectionMode` deve ser ativado somente após o administrador clicar no botão de cadastro.

## Coordenadas

`x` e `y` são valores normalizados de 0 a 1, com origem no canto superior esquerdo. Não são coordenadas do mundo GTA/FiveM.

## Limitação da imagem

O arquivo enviado, apesar do nome, mede 1365 × 2048 pixels. Os tiles preservam essa resolução; níveis superiores ampliam pixels, sem criar detalhes cartográficos.

## Próxima etapa

Integrar Firebase Authentication, Firestore, regras de segurança, painel de cadastro e conclusão individual. Este pacote não implementa essas funcionalidades.
