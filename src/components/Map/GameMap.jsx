import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./GameMap.css";

const MAP_WIDTH = 1365;
const MAP_HEIGHT = 2048;
const TILE_SIZE = 512;
const imageCRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1 / 4, 0, -1 / 4, 0)
});

export function normalizedToLatLng(x, y) {
    return L.latLng(-y * MAP_HEIGHT, x * MAP_WIDTH);
}

export function latLngToNormalized(latlng) {
    return {
        x: latlng.lng / MAP_WIDTH,
        y: -latlng.lat / MAP_HEIGHT
    };
}

export default function GameMap({ points = [], selectedId, onMapSelect, selectionMode = false, onPointClick }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const layerRef = useRef(null);
    const handlersRef = useRef({ onMapSelect, onPointClick, selectionMode });

    useEffect(() => {
        handlersRef.current = { onMapSelect, onPointClick, selectionMode };
        if (containerRef.current) {
            containerRef.current.style.cursor = selectionMode ? "crosshair" : "grab";
        }
    }, [onMapSelect, onPointClick, selectionMode]);

    useEffect(() => {
        if (!containerRef.current) return;
        const bounds = L.latLngBounds([-MAP_HEIGHT, 0], [0, MAP_WIDTH]);
        const map = L.map(containerRef.current, {
            crs: imageCRS,
            minZoom: -2,
            maxZoom: 4,
            zoomSnap: 0.25,
            maxBounds: bounds.pad(0.2),
            maxBoundsViscosity: 1,
            attributionControl: false
        });
        L.tileLayer("/maps/tiles/{z}/{x}/{y}.webp?v=roxo-fundo-2", {
            tileSize: TILE_SIZE,
            minNativeZoom: 0,
            maxNativeZoom: 2,
            minZoom: -2,
            maxZoom: 4,
            noWrap: true,
            bounds
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        map.fitBounds(bounds);
        map.on("click", (event) => {
            const { selectionMode: active, onMapSelect: handler } = handlersRef.current;
            if (!active || !handler) return;
            const point = latLngToNormalized(event.latlng);
            if (point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1) {
                handler(point);
            }
        });
        return () => {
            map.remove();
            mapRef.current = null;
            layerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!layerRef.current) return;
        layerRef.current.clearLayers();
        const colors = { easy: "#49d5a0", medium: "#f4c85a", hard: "#ff697b" };
        points.forEach((point) => {
            if (![point.x, point.y].every(Number.isFinite)) return;
            const icon = L.divIcon({
                className: "witch-marker-container",
                html: `<span class="witch-marker ${point.completed ? "is-completed" : ""}" style="--marker-color:${point.completed ? "#3B82F6" : (colors[point.difficulty] || colors.easy)}"></span>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });
            L.marker(normalizedToLatLng(point.x, point.y), { icon })
                .on("click", () => handlersRef.current.onPointClick?.(point))
                .addTo(layerRef.current);
        });
    }, [points]);

    useEffect(() => {
        const point = points.find((entry) => entry.id === selectedId);
        if (point && mapRef.current) {
            mapRef.current.flyTo(normalizedToLatLng(point.x, point.y), Math.max(mapRef.current.getZoom(), 1), {
                duration: 0.7
            });
        }
    }, [selectedId]);

    return <div ref={containerRef} className="game-map" aria-label="Mapa interativo da cidade" />;
}
