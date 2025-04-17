import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Star, MapPin, Calendar, Clock, Users, Wifi, Coffee, Utensils, Plane, Bus, Hotel,
  Check, ChevronDown, ChevronUp, Heart
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Slider from 'react-slick';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Cấu hình icon tùy chỉnh cho các địa điểm trong tour
const customIcon = L.icon({
  iconUrl: '/images/flag.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Cấu hình icon cho tọa độ hiện tại (Khách sạn Mường Thanh)
const currentLocationIcon = L.icon({
  iconUrl: '/images/location.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Cấu hình icon xe hơi để di chuyển trên bản đồ
const carIcon = L.icon({
  iconUrl: '/images/car.gif',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// Component để vẽ tuyến đường và di chuyển icon xe hơi
const RoutingMachine = ({ waypoints, animateCar }) => {
  const map = useMap();
  const [carMarker, setCarMarker] = useState(null);

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    // Xóa tuyến đường và marker xe hơi cũ (nếu có)
    if (carMarker) {
      map.removeLayer(carMarker);
    }
    map.eachLayer((layer) => {
      if (layer instanceof L.Routing.Control) {
        map.removeControl(layer);
      }
    });

    // Tạo plan với tùy chỉnh marker
    const plan = L.Routing.plan(
      waypoints.map(point => L.latLng(point.lat, point.lng)),
      {
        createMarker: () => null,
        addWaypoints: false,
        routeWhileDragging: true,
      }
    );

    const routingControl = L.Routing.control({
      plan: plan,
      routeWhileDragging: true,
      show: true,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#ff6200', weight: 4 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
        language: 'vi',
      }),
    }).addTo(map);

    // Khi tuyến đường được vẽ xong, lấy tọa độ và di chuyển xe hơi
    routingControl.on('routesfound', (e) => {
      const route = e.routes[0];
      const coordinates = route.coordinates;

      if (animateCar) {
        const newCarMarker = L.marker(coordinates[0], { icon: carIcon }).addTo(map);
        setCarMarker(newCarMarker);

        let index = 0;
        const moveCar = () => {
          if (index < coordinates.length) {
            newCarMarker.setLatLng(coordinates[index]);
            index += 1;
            setTimeout(moveCar, 50);
          }
        };
        moveCar();
      }
    });

    return () => {
      map.removeControl(routingControl);
      if (carMarker) {
        map.removeLayer(carMarker);
      }
    };
  }, [map, waypoints, animateCar]);

  return null;
};

const TourDetails = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const itineraryData = location.state?.itinerary;
  const BASE_URL = 'http://localhost:8000';

  // Vị trí hiện tại (Khách sạn Mường Thanh)
  const currentLocation = {
    lat: 16.054054614098437,
    lng: 108.24713719515304,
    name: 'Khách sạn Mường Thanh',
  };

  const itineraryByDay = itineraryData
    ? itineraryData.locations.reduce((acc, loc) => {
        if (!acc[loc.day]) acc[loc.day] = [];
        acc[loc.day].push({
          id: loc.id,
          locationId: loc.location.id,
          title: loc.location.name,
          description: `Visit ${loc.location.name} (${loc.location.tourism_type})`,
          time: loc.estimated_time,
          tourism_type: loc.location.tourism_type,
          image: loc.location.images?.length > 0 ? `${BASE_URL}/media${loc.location.images[0].url}` : '/images/default-placeholder.jpg',
          geom: loc.location.geom || null,
          day: loc.day,
          visit_order: loc.visit_order,
          lat: loc.location.geom?.lat || loc.location.geom?.coordinates[1],
          lng: loc.location.geom?.lng || loc.location.geom?.coordinates[0],
        });
        return acc;
      }, {})
    : {};

  const fetchAlternatives = async (tourismType) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/locations/alternatives/${tourismType}/`);
      setAlternatives(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy địa điểm thay thế:', error);
      alert('Không thể tải danh sách địa điểm thay thế.');
    }
  };

  const handleChangeLocation = (item) => {
    setSelectedLocation(item);
    fetchAlternatives(item.tourism_type);
  };

  const handleUpdateLocation = async (newLocationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${BASE_URL}/api/itinerary/${itineraryData.id}/update/`,
        { location_id: selectedLocation.locationId, new_location_id: newLocationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/tour-details', { state: { itinerary: response.data, currentLocation } });
      setSelectedLocation(null);
    } catch (error) {
      console.error('Lỗi khi cập nhật địa điểm:', error);
      alert('Vui lòng đăng nhập để thay đổi địa điểm.');
      navigate('/login');
    }
  };

  const handleSaveItinerary = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      await axios.put(
        `${BASE_URL}/api/itinerary/${itineraryData.id}/update/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Lịch trình đã được lưu thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu lịch trình:', error);
      alert('Vui lòng đăng nhập để lưu lịch trình.');
      navigate('/login');
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleLocationClick = (item) => {
    if (!item.lat || !item.lng) return;

    const startLocation = lastLocation || currentLocation;

    const route = [
      { lat: startLocation.lat, lng: startLocation.lng, name: startLocation.name },
      { lat: item.lat, lng: item.lng, name: item.title },
    ];

    setSelectedRoute(route);
    setLastLocation({ lat: item.lat, lng: item.lng, name: item.title });
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  const tourLocations = itineraryData
    ? itineraryData.locations
        .filter((loc) => loc.location.geom && loc.location.geom.lat && loc.location.geom.lng)
        .map((loc) => ({
          name: loc.location.name,
          lat: loc.location.geom.lat,
          lng: loc.location.geom.lng,
          day: loc.day,
          visit_order: loc.visit_order,
        }))
        .sort((a, b) => {
          if (a.day === b.day) {
            return a.visit_order - b.visit_order;
          }
          return a.day - b.day;
        })
    : [];

  const allLocations = currentLocation ? [...tourLocations, currentLocation] : tourLocations;
  const mapCenter: LatLngTuple = allLocations.length > 0
    ? [
        allLocations.reduce((sum, loc) => sum + loc.lat, 0) / allLocations.length,
        allLocations.reduce((sum, loc) => sum + loc.lng, 0) / allLocations.length,
      ]
    : [16.0471, 108.2062];

  return (
    <div className="pt-20">
      {/* Tour Header */}
      <section
        className="relative h-[50vh] min-h-[400px] flex items-end bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="tourigo-container relative z-10 pb-8">
          <div className="flex items-center text-white text-sm gap-2 mb-3">
            <Link to="/" className="hover:text-tourigo-primary">Home</Link>
            <span>/</span>
            <span>Lịch trình Đà Nẵng</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Lịch trình du lịch Đà Nẵng
              </h1>
              <div className="flex items-center flex-wrap gap-4 text-white">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Đà Nẵng, Việt Nam</span>
                </div>
                <div className="flex items-center text-tourigo-secondary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                  <span className="text-white ml-2">(48 reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-tourigo-dark"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-tourigo-secondary text-tourigo-secondary' : ''}`} />
                Wishlist
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="tourigo-container">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <img 
                      src="https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                      alt="Tour main" 
                      className="w-full h-[400px] object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <img 
                      src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Tour gallery 1" 
                      className="w-full h-[200px] object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <img 
                      src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Tour gallery 2" 
                      className="w-full h-[200px] object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <Tabs defaultValue="itinerary" className="w-full">
                <TabsList className="w-full justify-start mb-6 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="itinerary">Lịch trình</TabsTrigger>
                </TabsList>

                <TabsContent value="itinerary" className="animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">Lịch trình của bạn</h2>
                    {itineraryData ? (
                      <div className="space-y-6">
                        {Object.keys(itineraryByDay).map((day) => (
                          <div key={day} className="border-l-2 border-tourigo-primary pl-6 relative">
                            <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-tourigo-primary"></div>
                            <h3 className="text-xl font-medium mb-2">Ngày {day}</h3>
                            {itineraryByDay[day].map((item, index) => (
                              <div
                                key={index}
                                className="mb-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
                                onClick={() => handleLocationClick(item)}
                              >
                                <div className="flex items-start">
                                  <img 
                                    src={item.image} 
                                    alt={item.title} 
                                    className="w-16 h-16 object-cover rounded-lg mr-4"
                                  />
                                  <div>
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-gray-600">{item.description}</p>
                                    <p className="text-sm text-gray-500">Thời gian dự kiến: {item.time}</p>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChangeLocation(item);
                                  }}
                                >
                                  Thay đổi
                                </Button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>Không có dữ liệu lịch trình.</p>
                    )}
                    <Button 
                      className="w-full bg-tourigo-primary hover:bg-tourigo-dark mt-6"
                      onClick={handleSaveItinerary}
                    >
                      Lưu lịch trình
                    </Button>
                    {selectedLocation && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Chọn địa điểm thay thế cho {selectedLocation.title}
                        </h3>
                        <Slider {...sliderSettings}>
                          {alternatives.map((alt) => (
                            <div key={alt.id} className="px-2">
                              <div className="bg-gray-100 p-4 rounded-lg">
                                <img 
                                  src={alt.images?.length > 0 ? `${BASE_URL}/media${alt.images[0].url}` : '/images/default-placeholder.jpg'} 
                                  alt={alt.name} 
                                  className="w-full h-32 object-cover rounded-lg mb-2"
                                />
                                <p className="font-medium">{alt.name}</p>
                                <Button 
                                  className="mt-2" 
                                  onClick={() => handleUpdateLocation(alt.id)}
                                >
                                  Chọn
                                </Button>
                              </div>
                            </div>
                          ))}
                        </Slider>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-24">
                <div className="border-t border-gray-200 p-4">
                  <h3 className="text-lg font-semibold mb-4">Bản đồ các địa điểm</h3>
                  <div className="mb-4">
                    <label htmlFor="day-select" className="mr-2">Chọn ngày để xem lộ trình:</label>
                    <select
                      id="day-select"
                      value={selectedDay || ''}
                      onChange={(e) => setSelectedDay(e.target.value ? parseInt(e.target.value) : null)}
                      className="border border-gray-300 rounded-md p-2"
                    >
                      <option value="">Tất cả các ngày</option>
                      {Object.keys(itineraryByDay).map(day => (
                        <option key={day} value={day}>Ngày {day}</option>
                      ))}
                    </select>
                  </div>
                  {tourLocations.length > 0 || currentLocation ? (
                    <div className="h-[516px]">
                      <MapContainer
                        center={mapCenter}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                        key={allLocations.map(loc => `${loc.lat}-${loc.lng}`).join(',')}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {tourLocations
                          .filter(loc => !selectedDay || loc.day === selectedDay)
                          .map((loc, index) => (
                            <Marker
                              key={index}
                              position={[loc.lat, loc.lng]}
                              icon={customIcon}
                            >
                              <Popup>{loc.name}</Popup>
                            </Marker>
                          ))}
                        {currentLocation && (
                          <Marker
                            position={[currentLocation.lat, currentLocation.lng]}
                            icon={currentLocationIcon}
                          >
                            <Popup>{currentLocation.name}</Popup>
                          </Marker>
                        )}
                        {selectedRoute && (
                          <RoutingMachine waypoints={selectedRoute} animateCar={true} />
                        )}
                      </MapContainer>
                    </div>
                  ) : (
                    <p className="text-gray-600">Không có dữ liệu tọa độ để hiển thị.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slider for Itinerary Locations */}
      <section className="py-12 bg-tourigo-gray-100">
        <div className="tourigo-container">
          <h2 className="text-2xl font-semibold mb-6">Các địa điểm trong lịch trình</h2>
          {itineraryData && itineraryData.locations.length > 0 ? (
            <Slider {...sliderSettings}>
              {itineraryData.locations.map((loc, index) => {
                const details = typeof loc.location.details === 'string' 
                  ? JSON.parse(loc.location.details) 
                  : loc.location.details;
                return (
                  <div key={index} className="px-2">
                    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                      <img 
                        src={loc.location.images?.length > 0 ? `${BASE_URL}/media${loc.location.images[0].url}` : '/images/default-placeholder.jpg'} 
                        alt={loc.location.name}
                        className="w-full h-[220px] object-cover"
                      />
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">
                          <Link 
                            to={`/blog-details/${loc.location.id}`} 
                            className="hover:text-tourigo-primary transition-colors duration-300"
                          >
                            {loc.location.name}
                          </Link>
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {details.short_description || 'Không có mô tả.'}
                        </p>
                        <Link 
                          to={`/blog-details/${loc.location.id}`} 
                          className="text-tourigo-primary font-medium inline-flex items-center hover:text-tourigo-dark transition-colors duration-300"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Slider>
          ) : (
            <p className="text-gray-600">Không có địa điểm nào trong lịch trình.</p>
          )}
        </div>
      </section>
    </div>
  );
};



export default TourDetails;