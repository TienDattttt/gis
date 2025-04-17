import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Calendar, User, Tag, ArrowRight, ChevronRight, Star } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { debounce } from 'lodash';

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
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [userRating, setUserRating] = useState(null);
  const BASE_URL = 'http://localhost:8000';

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
  const token = useMemo(() => localStorage.getItem('access_token'), []);

  const fetchLocation = debounce(async () => {
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
        ratings: data.ratings || [],
        average_rating: data.average_rating || null,
      });

      if (user && token) {
        const userRating = data.ratings.find(r => r.user === user.username);
        if (userRating) {
          setUserRating(userRating);
          setRatingScore(userRating.score);
          setRatingComment(userRating.comment || '');
        }
      }
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, 500);

  const fetchRelatedPosts = debounce(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/locations/?all=true`);
      let locations = response.data.results || response.data;
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
  }, 500);

  useEffect(() => {
    if (!location) {
      fetchLocation();
    }
  }, [id, location]);

  useEffect(() => {
    if (relatedPosts.length === 0) {
      fetchRelatedPosts();
    }
  }, [id, relatedPosts]);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Vui lòng đăng nhập để đánh giá.');
      return;
    }
    try {
      const data = {
        location: id,
        score: ratingScore,
        comment: ratingComment,
      };
      let response;
      if (userRating) {
        response = await axios.put(`${BASE_URL}/api/ratings/${userRating.id}/update/`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.post(`${BASE_URL}/api/ratings/create/`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setUserRating(response.data);
      setLocation(prev => ({
        ...prev,
        ratings: userRating
          ? prev.ratings.map(r => (r.id === response.data.id ? response.data : r))
          : [...prev.ratings, response.data],
      }));
      alert('Đánh giá đã được gửi thành công!');
    } catch (err) {
      alert(err.response?.data?.error || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    }
  };

  const handleStarClick = (score) => {
    setRatingScore(score);
  };

  if (loading) return <div className="text-center py-16">Đang tải...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!location) return <div className="text-center py-16">Không tìm thấy dữ liệu.</div>;

  return (
    <div className="pt-24 pb-16">
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
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl overflow-hidden shadow-md">
                <img
                  src={location.images[0]?.url ? `${BASE_URL}/media${location.images[0].url}` : 'https://via.placeholder.com/400'}
                  alt={location.title}
                  className="w-full h-[400px] object-cover"
                />
                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center text-gray-600 mb-6">
                    <p className="mr-6"><strong>Giờ mở cửa:</strong> {location.opening_hours}</p>
                    <p><strong>Địa chỉ:</strong> {location.address}</p>
                    {location.average_rating && (
                      <p className="ml-6"><strong>Điểm trung bình:</strong> {location.average_rating} / 5</p>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-6">{location.title}</h1>
                  <div className="prose max-w-none">
                    <p className="mb-6">{location.description1}</p>
                  </div>
                  <div className="my-8">
                    <iframe
                      width="100%"
                      height="315"
                      src={
                        location.videos && typeof location.videos === 'string'
                          ? location.videos.replace("watch?v=", "embed/").split('&')[0]
                          : "https://www.youtube.com/embed/dQw4w9WgXcQ"
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
                      src={`${BASE_URL}/media${location.images[1].url}`}
                      alt="Hình ảnh bổ sung"
                      className="w-full h-[450px] object-cover rounded-lg my-8"
                    />
                  )}
                </div>
              </div>

              {/* Phần đánh giá */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-md mt-8">
                <h3 className="text-xl font-semibold mb-6">Đánh giá</h3>
                <div className="space-y-6">
                  {location.ratings.length > 0 ? (
                    location.ratings.map((rating, index) => (
                      <div key={index} className="flex gap-4">
                        <Avatar>
                          <AvatarFallback>{rating.user.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between mb-2">
                            <h4 className="font-medium">{rating.user}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < rating.score ? 'fill-tourigo-secondary text-tourigo-secondary' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-600 mb-3">{rating.comment}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">Chưa có đánh giá nào.</p>
                  )}
                </div>
              </div>

              {/* Form gửi đánh giá */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-md mt-8">
                <h3 className="text-xl font-semibold mb-6">{userRating ? 'Chỉnh sửa đánh giá' : 'Gửi đánh giá của bạn'}</h3>
                <form className="space-y-4" onSubmit={handleRatingSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đánh giá</label>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 cursor-pointer ${i < ratingScore ? 'fill-tourigo-secondary text-tourigo-secondary' : 'text-gray-300'}`}
                          onClick={() => handleStarClick(i + 1)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bình luận</label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Viết bình luận của bạn..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-tourigo-primary hover:bg-tourigo-dark"
                    disabled={ratingScore === 0}
                  >
                    {userRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                  </Button>
                </form>
              </div>
            </div>

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

export default BlogDetails;