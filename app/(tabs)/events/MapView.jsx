'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from "@/app/(tabs)/events/list.module.css";
import {useRouter} from "next/navigation";
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
    iconUrl: 'leaflet/images/marker-icon.png',
    shadowUrl: 'leaflet/images/marker-shadow.png',
});

export default function MapView({ events, onSelectEvent }) {
    const router = useRouter();
    const moscowCenter = [55.7558, 37.6176];
    const navigateToGroupPage = (event) => {
        router.push(`/event/${event.eventId}`);
    };
    return (
        <MapContainer
            center={moscowCenter}
            attributionControl={false}
            zoom={10}
            style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {events.map((event) => (
                <CircleMarker
                    key={event.eventId}
                    center={[event.latitude, event.longitude]}
                    radius={8}
                    color="blue"
                    fillColor="blue"
                    fillOpacity={0.8}
                    weight={2}
                >
                    <Popup>
                        <h2>{event.name}</h2>
                        <p>{(event.description || '').substring(0, 50)}{event.description && event.description.length > 50 ? '...' : ''}</p>
                        <button
                            className={styles.cardButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigateToGroupPage(event);
                            }}
                        >
                            Подробнее
                        </button>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}
