import { Navigate, Route, Routes } from 'react-router-dom';
import EventClosed from './pages/EventClosed';
import PublicMap from './pages/PublicMap';
export default function ClosedApp() { return <Routes><Route path="/" element={<EventClosed/>}/><Route path="/mapa" element={<PublicMap/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>; }
