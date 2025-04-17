import { MapComponent } from '@/components/Map/MapComponent';
import '@/components/Map/Map.css';

const Map = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Đảm bảo container cha có chiều cao để bản đồ hiển thị */}
      <div className="flex-grow" style={{ minHeight: '0' }}>
        <MapComponent />
      </div>
    </div>
  );
};

export default Map;
