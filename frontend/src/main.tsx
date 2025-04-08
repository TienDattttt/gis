import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

createRoot(document.getElementById("root")!).render(<App />);
