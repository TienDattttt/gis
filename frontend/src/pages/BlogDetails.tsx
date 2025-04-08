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
  iconUrl: '/images/travel.png', // Đường dẫn đến icon trong thư mục public
  iconSize: [38, 38], // Kích thước của icon (width, height)
  iconAnchor: [19, 38], // Điểm neo của icon (thường là giữa và dưới cùng của icon)
  popupAnchor: [0, -38], // Điểm neo của popup (thường là phía trên icon)
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', // Bóng của marker (tùy chọn)
  shadowSize: [41, 41], // Kích thước bóng
});

const BlogDetails = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8000/api/locations/${id}/`);
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
          geom: data.geom || null, // Đã thêm geom
        });
        setLoading(false);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
  
    fetchLocation();
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
                {/* Image 1 */}
                <img 
                  src={`${BASE_URL}/media${location.images[0]?.url}`} 
                  alt={location.title} 
                  className="w-full h-[400px] object-cover"
                />
                
                <div className="p-6 md:p-8">
                  {/* Opening Hours and Address */}
                  <div className="flex flex-wrap items-center text-gray-600 mb-6">
                    <p className="mr-6"><strong>Giờ mở cửa:</strong> {location.opening_hours}</p>
                    <p><strong>Địa chỉ:</strong> {location.address}</p>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl font-bold mb-6">{location.title}</h1>

                  {/* Description 1 */}
                  <div className="prose max-w-none">
                    <p className="mb-6">{location.description1}</p>
                  </div>

                  {/* Poem */}
                  <blockquote className="border-l-4 border-tourigo-primary pl-4 italic my-8">
                    "Nắng vàng rơi trên lối nhỏ, <br />
                    Gió khẽ hát giữa trời xanh, <br />
                    Bali ơi, mộng mơ lành, <br />
                    Một lần đến, mãi vấn vương." 
                    <cite className="block text-sm not-italic mt-2">— Thơ tự sáng tác</cite>
                  </blockquote>

                  {/* Video */}
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

                  {/* Description 2 */}
                  <div className="prose max-w-none">
                    <p className="mb-6">{location.description2}</p>
                  </div>

                  {/* Image 2 */}
                  {location.images[1] && (
                    <img 
                    src={`${BASE_URL}/media${location.images[1]?.url}`} 
                      alt="Hình ảnh bổ sung"
                      className="w-full h-[450px] object-cover rounded-lg my-8"
                    />
                  )}


                  {/* Tags */}
                  <div className="flex flex-wrap items-center mt-6 pt-6 border-t border-gray-100">
                    <span className="font-medium mr-3">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {["Điểm tham quan", "Du lịch", "Văn hóa"].map((tag, index) => (
                        <Link 
                          key={index}
                          to="#" 
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-tourigo-primary hover:text-white transition-colors duration-300"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            

              {/* Comments */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-md mt-8">
                <h3 className="text-xl font-semibold mb-6">Bình luận</h3>
                {/* Giữ nguyên danh sách bình luận mẫu */}
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

              {/* Comment Form */}
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

            {/* Sidebar giữ nguyên */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                <h3 className="text-lg font-semibold mb-4">Tìm kiếm</h3>
                <div className="relative">
                  <Input type="text" placeholder="Tìm kiếm bài viết..." className="pr-10" />
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
  <h3 className="text-lg font-semibold mb-4">Vị trí địa điểm</h3>
  {location.geom && location.geom.lat && location.geom.lng ? (
    <div className="h-64">
      <MapContainer
        center={[location.geom.lat, location.geom.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        key={`${location.geom.lat}-${location.geom.lng}`} // Thêm key để force re-render khi tọa độ thay đổi
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                <div className="space-y-4">
                  {recentPosts.map((post, index) => (
                    <div key={index} className="flex items-start">
                      <img src={post.image} alt={post.title} className="w-20 h-20 object-cover rounded-lg mr-3" />
                      <div>
                        <h4 className="font-medium hover:text-tourigo-primary">
                          <Link to="/blog-details">{post.title}</Link>
                        </h4>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {post.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Link key={index} to="#" className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-tourigo-primary hover:text-white">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <section className="py-12 bg-tourigo-gray-100">
        <div className="tourigo-container">
          <h2 className="text-2xl font-semibold mb-8">Bạn có thể thích</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedPosts.map((post, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <Link to="/blog-details" className="block">
                  <img src={post.image} alt={post.title} className="w-full h-[220px] object-cover" />
                </Link>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="h-4 w-4 mr-1" />
                    {post.date}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    <Link to="/blog-details" className="hover:text-tourigo-primary">{post.title}</Link>
                  </h3>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <Link to="/blog-details" className="text-tourigo-primary font-medium inline-flex items-center hover:text-tourigo-dark">
                    Xem thêm <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="tourigo-container text-center">
          <div className="max-w-3xl mx-auto animate-fade-up">
            <h2 className="text-3xl font-bold mb-6">Sẵn sàng cho chuyến đi tiếp theo?</h2>
            <p className="text-lg text-gray-600 mb-8">Khám phá các tour được chọn lọc kỹ càng và tạo nên những kỷ niệm đáng nhớ.</p>
            <Link to="/tour-details" className="btn-primary inline-flex items-center">
              Khám phá tour <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Sample Data (giữ nguyên như cũ)
const categories = [
  { name: "Du lịch mạo hiểm", count: 15 },
  { name: "Trải nghiệm văn hóa", count: 12 },
  { name: "Ẩm thực", count: 8 },
  { name: "Mẹo du lịch", count: 20 },
  { name: "Điểm đến", count: 25 },
  { name: "Nhiếp ảnh", count: 6 }
];

const recentPosts = [
  { title: "Những viên ngọc ẩn của Santorini", date: "May 22, 2023", image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80" },
  { title: "Hành trình khám phá ẩm thực Nhật Bản", date: "April 10, 2023", image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=800&q=80" },
  { title: "Trải nghiệm Paris như người bản địa", date: "March 5, 2023", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80" }
];

const tags = ["Điểm tham quan", "Bảo tàng", "Công viên giải trí", "Điểm ngắm cảnh"];

const comments = [
  { name: "Sarah Thompson", avatar: "https://randomuser.me/api/portraits/women/44.jpg", date: "June 16, 2023", text: "Cảm ơn vì bài viết tuyệt vời! Tôi đang lên kế hoạch đến đây." },
  { name: "David Chen", avatar: "https://randomuser.me/api/portraits/men/67.jpg", date: "June 18, 2023", text: "Tôi đã đến đây năm ngoái và đồng ý với mọi điều bạn viết." },
  { name: "Emma Wilson", avatar: "https://randomuser.me/api/portraits/women/63.jpg", date: "June 20, 2023", text: "Bài viết hay! Tôi tò mò về cách di chuyển ở đây." }
];

const relatedPosts = [
  { title: "Những viên ngọc ẩn của Santorini", excerpt: "Khám phá những điểm đến ít người biết.", date: "May 22, 2023", image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80" },
  { title: "Hành trình khám phá ẩm thực Nhật Bản", excerpt: "Khám phá thế giới ẩm thực Nhật Bản.", date: "April 10, 2023", image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=800&q=80" },
  { title: "Trải nghiệm Paris như người bản địa", excerpt: "Bỏ qua các điểm du lịch đông đúc.", date: "March 5, 2023", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80" }
];

export default BlogDetails;