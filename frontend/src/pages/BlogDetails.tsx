import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Search, Calendar, User, Tag, ArrowRight, ChevronRight
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = L.icon({
  iconUrl: '/images/travel.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const BlogDetails = () => {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/locations/${id}/`);
        const data = response.data;
  
        const details = typeof data.details === 'string' ? JSON.parse(data.details) : data.details;
        setLocation({
          id: data.id,
          name: data.name || 'Không có tên',
          images: data.images || [],
          title: details.title || 'Không có tiêu đề',
          description1: details.description_1 || 'Không có mô tả ngắn.',
          description2: details.description_2 || 'Không có mô tả chi tiết.',
          opening_hours: details.basic_info?.opening_hours || 'Giờ mở cửa không có sẵn',
          address: details.basic_info?.address || 'Địa chỉ không có sẵn',
          created_at: data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A',
          videos: details.videos && details.videos.length > 0 ? details.videos[0].url : '',
          geom: data.geom || null,
        });
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedPosts = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/locations/?all=true`);
        const data = response.data;

        // Kiểm tra nếu dữ liệu có thuộc tính results
        if (!data.results || !Array.isArray(data.results)) {
          console.error('Không tìm thấy mảng results trong dữ liệu:', data);
          setRelatedPosts([]);
          return;
        }

        // Lấy tất cả các địa điểm từ trang đầu tiên
        let locations = data.results;

        // Nếu có phân trang (next không null), có thể lấy thêm dữ liệu từ các trang tiếp theo
        let nextUrl = data.next;
        while (nextUrl) {
          const nextResponse = await axios.get(nextUrl);
          const nextData = nextResponse.data;
          if (nextData.results && Array.isArray(nextData.results)) {
            locations = [...locations, ...nextData.results];
          }
          nextUrl = nextData.next;
        }

        // Lọc bỏ địa điểm hiện tại và chọn ngẫu nhiên 3 địa điểm
        const otherLocations = locations.filter(loc => loc.id !== parseInt(id));
        const shuffled = otherLocations.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        const formattedPosts = selected.map(loc => {
          const details = typeof loc.details === 'string' ? JSON.parse(loc.details) : loc.details;
          return {
            id: loc.id,
            title: details.title || loc.name || 'Không có tiêu đề',
            
            image: loc.images && loc.images.length > 0
              ? `${BASE_URL}/media${loc.images[0].url}`
              : 'https://via.placeholder.com/150',
          };
        });

        setRelatedPosts(formattedPosts);
      } catch (err) {
        console.error('Lỗi khi lấy bài viết liên quan:', err);
        setRelatedPosts([]);
      }
    };

    fetchLocation();
    fetchRelatedPosts();
  }, [id]);

  if (loading) return <div className="text-center py-16">Đang tải...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!location) return <div className="text-center py-16">Không tìm thấy dữ liệu.</div>;

  return (
    <div className="pt-24 pb-16">
      {/* Page Header */}
      <section className="bg-tourigo-gray-100 py-12">
        <div className="tourigo-container">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Chi tiết địa điểm</h1>
            <div className="flex items-center text-sm gap-2">
              <Link to="/" className="hover:text-tourigo-primary">Trang chủ</Link>
              <span>/</span>
              <Link to="/blog-grid" className="hover:text-tourigo-primary">Blog</Link>
              <span>/</span>
              <span>{location.title}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="tourigo-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl overflow-hidden shadow-md">
                <img 
                  src={`${BASE_URL}/media${location.images[0]?.url}`} 
                  alt={location.title} 
                  className="w-full h-[400px] object-cover"
                />
                
                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center text-gray-600 mb-6">
                    <p className="mr-6"><strong>Giờ mở cửa:</strong> {location.opening_hours}</p>
                    <p><strong>Địa chỉ:</strong> {location.address}</p>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold mb-6">{location.title}</h1>

                  <div className="prose max-w-none">
                    <p className="mb-6">{location.description1}</p>
                  </div>

                  <blockquote className="border-l-4 border-tourigo-primary pl-4 italic my-8">
                    "Nắng vàng rơi trên lối nhỏ, <br />
                    Gió khẽ hát giữa trời xanh, <br />
                    Bali ơi, mộng mơ lành, <br />
                    Một lần đến, mãi vấn vương." 
                    <cite className="block text-sm not-italic mt-2">— Thơ tự sáng tác</cite>
                  </blockquote>

                  <div className="my-8">
                    <iframe
                      width="100%"
                      height="315"
                      src={
                        location.videos && typeof location.videos === 'string'
                          ? location.videos.replace("watch?v=", "embed/").split('&')[0]
                          : "https://www.youtube.com/embed/VIDEO_ID_HERE"
                      }
                      title="Video về địa điểm"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg"
                    ></iframe>
                  </div>

                  <div className="prose max-w-none">
                    <p className="mb-6">{location.description2}</p>
                  </div>

                  {location.images[1] && (
                    <img 
                      src={`${BASE_URL}/media${location.images[1]?.url}`} 
                      alt="Hình ảnh bổ sung"
                      className="w-full h-[450px] object-cover rounded-lg my-8"
                    />
                  )}

                 
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 md:p-8 shadow-md mt-8">
                <h3 className="text-xl font-semibold mb-6">Bình luận</h3>
                <div className="space-y-6">
                  {comments.map((comment, index) => (
                    <div key={index} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>{comment.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between mb-2">
                          <h4 className="font-medium">{comment.name}</h4>
                          <span className="text-sm text-gray-500">{comment.date}</span>
                        </div>
                        <p className="text-gray-600 mb-3">{comment.text}</p>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-tourigo-primary">
                          Trả lời
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 md:p-8 shadow-md mt-8">
                <h3 className="text-xl font-semibold mb-6">Để lại bình luận</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                    <Input type="text" placeholder="Tên của bạn" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input type="email" placeholder="Email của bạn" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bình luận</label>
                  <textarea className="input-field min-h-24" placeholder="Bình luận của bạn" />
                </div>
                <Button className="bg-tourigo-primary hover:bg-tourigo-dark">Đăng bình luận</Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                <h3 className="text-lg font-semibold mb-4">Vị trí địa điểm</h3>
                {location.geom && location.geom.lat && location.geom.lng ? (
                  <div className="h-64">
                    <MapContainer
                      center={[location.geom.lat, location.geom.lng]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      key={`${location.geom.lat}-${location.geom.lng}`}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[location.geom.lat, location.geom.lng]} icon={customIcon}>
                        <Popup>{location.name}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                ) : (
                  <p className="text-gray-600">Không có dữ liệu tọa độ để hiển thị.</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                <h3 className="text-lg font-semibold mb-4">Các bài viết liên quan</h3>
                {relatedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {relatedPosts.map((post) => (
                      <div key={post.id} className="flex items-start">
                        <img src={post.image} alt={post.title} className="w-20 h-20 object-cover rounded-lg mr-3" />
                        <div>
                          <h4 className="font-medium hover:text-tourigo-primary">
                            <Link to={`/blog-details/${post.id}`}>{post.title}</Link>
                          </h4>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {post.date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Không có bài viết liên quan.</p>
                )}
              </div>

              
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};




const comments = [
  { name: "Sarah Thompson", avatar: "https://randomuser.me/api/portraits/women/44.jpg", date: "June 16, 2023", text: "Cảm ơn vì bài viết tuyệt vời! Tôi đang lên kế hoạch đến đây." },
  { name: "David Chen", avatar: "https://randomuser.me/api/portraits/men/67.jpg", date: "June 18, 2023", text: "Tôi đã đến đây năm ngoái và đồng ý với mọi điều bạn viết." },
  { name: "Emma Wilson", avatar: "https://randomuser.me/api/portraits/women/63.jpg", date: "June 20, 2023", text: "Bài viết hay! Tôi tò mò về cách di chuyển ở đây." }
];

export default BlogDetails;