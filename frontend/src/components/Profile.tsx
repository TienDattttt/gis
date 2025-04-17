import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Trash, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';
import { toast } from 'sonner';

const Profile = () => {
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const BASE_URL = 'http://localhost:8000';

    useEffect(() => {
        const fetchUserAndItineraries = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    toast.error('Vui lòng đăng nhập để xem hồ sơ.');
                    throw new Error('Vui lòng đăng nhập để xem hồ sơ.');
                }

                const userData = JSON.parse(localStorage.getItem('user'));
                if (!userData) {
                    toast.error('Không tìm thấy thông tin người dùng.');
                    throw new Error('Không tìm thấy thông tin người dùng.');
                }
                setUser(userData);

                const response = await axios.get(`${BASE_URL}/api/itineraries/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Itineraries response:', response.data);
                // Truy cập response.data.results thay vì response.data
                const itinerariesData = Array.isArray(response.data.results) ? response.data.results : [];
                if (itinerariesData.length === 0) {
                    toast.info('Bạn chưa lưu lịch trình nào.');
                }
                setItineraries(itinerariesData);
            } catch (err) {
                console.error('Error fetching itineraries:', err);
                const errorMessage = err.response?.data?.error || err.message || 'Không thể tải dữ liệu hồ sơ.';
                toast.error(errorMessage);
                setError(errorMessage);
                navigate('/sign-in');
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndItineraries();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        toast.success('Đã đăng xuất thành công!');
        navigate('/sign-in');
    };

    const handleDeleteItinerary = async (itineraryId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) return;

        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${BASE_URL}/api/itinerary/${itineraryId}/delete/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItineraries(itineraries.filter((itinerary) => itinerary.id !== itineraryId));
            toast.success('Lịch trình đã được xóa thành công!');
        } catch (err) {
            console.error('Lỗi khi xóa lịch trình:', err);
            toast.error(err.response?.data?.error || 'Không thể xóa lịch trình.');
        }
    };

    if (loading) return <div className="text-center py-16">Đang tải...</div>;
    if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

    return (
        <div className="pt-20 pb-16 bg-tourigo-gray-100 min-h-screen">
            <section className="tourigo-container">
                <div className="flex items-center text-sm gap-2 mb-6">
                    <Link to="/" className="hover:text-tourigo-primary">Home</Link>
                    <span>/</span>
                    <span>Hồ sơ</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center">
                                    <User className="h-5 w-5 mr-2 text-tourigo-primary" />
                                    Thông tin người dùng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {user ? (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Tên người dùng</p>
                                            <p className="font-medium">{user.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="font-medium">{user.email}</p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            className="w-full flex items-center justify-center"
                                            onClick={handleLogout}
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Đăng xuất
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-gray-600">Không có thông tin người dùng.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-3">
                        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold">Lịch trình đã lưu</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {itineraries.length > 0 ? (
                                    <div className="space-y-6">
                                        {itineraries.map((itinerary) => (
                                            <div
                                                key={itinerary.id}
                                                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-semibold">
                                                        Lịch trình #{itinerary.id} - {itinerary.survey_data?.days || 'N/A'} ngày
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            asChild
                                                            className="bg-tourigo-primary hover:bg-tourigo-dark"
                                                        >
                                                            <Link
                                                                to="/tour-details"
                                                                state={{ itinerary, currentLocation: itinerary.survey_data?.current_location }}
                                                            >
                                                                Xem chi tiết
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="text-red-500 border-red-500 hover:bg-red-50"
                                                            onClick={() => handleDeleteItinerary(itinerary.id)}
                                                        >
                                                            <Trash className="h-4 w-4 mr-2" />
                                                            Xóa
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Separator className="my-4" />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-5 w-5 mr-2 text-tourigo-primary" />
                                                        <p>
                                                            Ngày tạo:{' '}
                                                            {new Date(itinerary.created_at).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <MapPin className="h-5 w-5 mr-2 text-tourigo-primary" />
                                                        <p>
                                                            Địa điểm:{' '}
                                                            {itinerary.locations
                                                                ?.map((loc) => loc.location?.name || 'N/A')
                                                                .join(', ') || 'Không có địa điểm'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-center py-8">
                                        Bạn chưa lưu lịch trình nào.{' '}
                                        <Link to="/" className="text-tourigo-primary hover:underline">
                                            Tạo lịch trình mới
                                        </Link>
                                        !
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Profile;