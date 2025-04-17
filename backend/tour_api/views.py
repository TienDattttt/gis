from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Location, Itinerary, ItineraryLocation, District, Rating
from .serializers import LocationSerializer, ItinerarySerializer, DistrictSerializer, RatingSerializer
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D

# View cho đăng ký
class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')

        if not all([username, email, password, confirm_password]):
            return Response({"error": "Tất cả các trường là bắt buộc"}, status=status.HTTP_400_BAD_REQUEST)

        if password != confirm_password:
            return Response({"error": "Mật khẩu xác nhận không khớp"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Tên người dùng đã tồn tại"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email đã được sử dụng"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {'username': user.username, 'email': user.email}
        }, status=status.HTTP_201_CREATED)

# View cho đăng nhập
class SignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not all([username, password]):
            return Response({"error": "Tên người dùng và mật khẩu là bắt buộc"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"error": "Thông tin đăng nhập không hợp lệ"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {'username': user.username, 'email': user.email}
        }, status=status.HTTP_200_OK)

# View cho đánh giá
class RatingCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RatingSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RatingUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            rating = Rating.objects.get(pk=pk, user=request.user)
        except Rating.DoesNotExist:
            return Response({"error": "Đánh giá không tồn tại hoặc bạn không có quyền chỉnh sửa"}, status=status.HTTP_404_NOT_FOUND)

        serializer = RatingSerializer(rating, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# View cho lưu lịch trình
class ItinerarySaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            original_itinerary = Itinerary.objects.get(pk=pk)
            # Kiểm tra xem lịch trình đã có người dùng khác sở hữu chưa
            if original_itinerary.user and original_itinerary.user != request.user:
                # Tạo bản sao của lịch trình
                new_itinerary = Itinerary.objects.create(
                    survey_data=original_itinerary.survey_data,
                    user=request.user
                )
                # Sao chép các ItineraryLocation
                for loc in original_itinerary.locations.all():
                    ItineraryLocation.objects.create(
                        itinerary=new_itinerary,
                        location=loc.location,
                        visit_order=loc.visit_order,
                        day=loc.day,
                        estimated_time=loc.estimated_time
                    )
                serializer = ItinerarySerializer(new_itinerary)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                # Nếu lịch trình chưa có người dùng hoặc thuộc về người dùng hiện tại, gắn người dùng
                original_itinerary.user = request.user
                original_itinerary.save()
                serializer = ItinerarySerializer(original_itinerary)
                return Response(serializer.data, status=status.HTTP_200_OK)
        except Itinerary.DoesNotExist:
            return Response(
                {"error": "Itinerary not found"},
                status=status.HTTP_404_NOT_FOUND
            )

# View cho xóa lịch trình
class ItineraryDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            itinerary = Itinerary.objects.get(pk=pk, user=request.user)
            itinerary.delete()
            return Response({"message": "Itinerary deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Itinerary.DoesNotExist:
            return Response(
                {"error": "Itinerary not found or you do not have permission to delete it"},
                status=status.HTTP_404_NOT_FOUND
            )

# View danh sách lịch trình
class ItineraryListView(generics.ListAPIView):
    serializer_class = ItinerarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Itinerary.objects.filter(user=self.request.user).order_by('-created_at')

# View gợi ý lịch trình
class ItinerarySuggestionView(APIView):
    def post(self, request):
        days = request.data.get('days', 1)
        current_lat = request.data.get('latitude')
        current_lng = request.data.get('longitude')
        tourism_types = ['viewpoint', 'museum', 'attraction', 'theme_park']

        # Kiểm tra dữ liệu đầu vào
        if not (current_lat and current_lng):
            return Response({"error": "Current location is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            days = int(days)
            if days < 1 or days > 3:
                return Response({"error": "Days must be between 1 and 3"}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"error": "Invalid number of days"}, status=status.HTTP_400_BAD_REQUEST)

        # Tạo điểm vị trí hiện tại
        current_location = Point(float(current_lng), float(current_lat), srid=4326)

        # Tạo lịch trình
        itinerary_data = {
            "survey_data": {
                "days": days,
                "current_location": {"lat": current_lat, "lng": current_lng}
            },
            "user": request.user if request.user.is_authenticated else None
        }

        # Lấy tất cả các địa điểm và tính khoảng cách từ vị trí hiện tại
        all_locations = Location.objects.filter(
            tourism_type__in=tourism_types,
            geom__isnull=False
        ).annotate(
            distance=Distance('geom', current_location)
        ).order_by('distance')

        if not all_locations:
            return Response({"error": "No available locations found"}, status=status.HTTP_404_NOT_FOUND)

        # Phân bổ địa điểm vào từng ngày
        itinerary_locations = []
        used_locations = set()
        locations_per_day = len(tourism_types)

        available_locations = list(all_locations)
        for day in range(1, days + 1):
            day_locations = []
            for tourism_type in tourism_types:
                for loc in available_locations:
                    if loc.id in used_locations or loc.tourism_type != tourism_type:
                        continue
                    day_locations.append(loc)
                    used_locations.add(loc.id)
                    break

            if len(day_locations) != locations_per_day:
                return Response(
                    {"error": f"Not enough locations for day {day}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            day_locations.sort(key=lambda loc: loc.distance.m)
            for idx, location in enumerate(day_locations, 1):
                itinerary_locations.append({
                    "location": location,
                    "visit_order": idx,
                    "day": day,
                    "estimated_time": "01:00:00"
                })

        # Lưu lịch trình vào database
        itinerary = Itinerary.objects.create(**itinerary_data)
        for loc_data in itinerary_locations:
            ItineraryLocation.objects.create(
                itinerary=itinerary,
                location=loc_data["location"],
                visit_order=loc_data["visit_order"],
                day=loc_data["day"],
                estimated_time=loc_data["estimated_time"]
            )

        serializer = ItinerarySerializer(itinerary)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# View cập nhật lịch trình
class ItineraryUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            itinerary = Itinerary.objects.get(pk=pk)
            # Nếu lịch trình thuộc về người dùng khác, tạo bản sao
            if itinerary.user and itinerary.user != request.user:
                # Tạo bản sao lịch trình
                new_itinerary = Itinerary.objects.create(
                    survey_data=itinerary.survey_data,
                    user=request.user
                )
                # Sao chép các ItineraryLocation
                for loc in itinerary.locations.all():
                    ItineraryLocation.objects.create(
                        itinerary=new_itinerary,
                        location=loc.location,
                        visit_order=loc.visit_order,
                        day=loc.day,
                        estimated_time=loc.estimated_time
                    )
                itinerary = new_itinerary
            # Nếu lịch trình không có user hoặc thuộc về người dùng hiện tại, tiếp tục chỉnh sửa
        except Itinerary.DoesNotExist:
            return Response(
                {"error": "Lịch trình không tồn tại"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Thay đổi địa điểm
        location_id_to_change = request.data.get('location_id')
        new_location_id = request.data.get('new_location_id')

        if location_id_to_change and new_location_id:
            try:
                # Tìm ItineraryLocation
                itinerary_locations = ItineraryLocation.objects.filter(
                    itinerary=itinerary,
                    location_id=location_id_to_change
                )
                if not itinerary_locations.exists():
                    return Response(
                        {"error": "Địa điểm không tồn tại trong lịch trình"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Lấy location mới
                new_location = Location.objects.get(id=new_location_id)

                # Kiểm tra tourism_type
                current_location = itinerary_locations.first().location
                if new_location.tourism_type != current_location.tourism_type:
                    return Response(
                        {"error": "Địa điểm mới phải có cùng loại hình du lịch"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Kiểm tra xem địa điểm mới đã có trong lịch trình chưa
                if new_location.id in [loc.location.id for loc in itinerary.locations.all()]:
                    return Response(
                        {"error": "Địa điểm này đã có trong lịch trình"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Cập nhật ItineraryLocation (chọn bản ghi đầu tiên nếu có nhiều)
                itinerary_location = itinerary_locations.first()
                itinerary_location.location = new_location
                itinerary_location.save()

            except Location.DoesNotExist:
                return Response(
                    {"error": "Địa điểm mới không tồn tại"},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception:
                return Response(
                    {"error": "Lỗi không xác định khi cập nhật địa điểm"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = ItinerarySerializer(itinerary)
        return Response(serializer.data, status=status.HTTP_200_OK)

# View danh sách địa điểm thay thế
class AlternativeLocationsView(APIView):
    def get(self, request, tourism_type):
        locations = Location.objects.filter(tourism_type=tourism_type)
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)

# View danh sách địa điểm
class LocationListView(generics.ListAPIView):
    serializer_class = LocationSerializer

    def get_queryset(self):
        queryset = Location.objects.all().order_by('id')
        search_query = self.request.query_params.get('search', None)
        tourism_type = self.request.query_params.get('tourism_type', None)
        nearby = self.request.query_params.get('nearby', None)
        lat = self.request.query_params.get('lat', None)
        lng = self.request.query_params.get('lng', None)
        district = self.request.query_params.get('district', None)
        limit = self.request.query_params.get('limit', 20)

        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 20

        # Lọc theo quận/huyện
        if district:
            try:
                district_obj = District.objects.get(name=district)
                queryset = queryset.filter(geom__within=district_obj.geom)
            except District.DoesNotExist:
                queryset = queryset.none()

        # Tìm kiếm theo từ khóa
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(name_vi__icontains=search_query) |
                Q(details__contains=search_query)
            )

        # Lọc theo tourism_type
        if tourism_type:
            queryset = queryset.filter(tourism_type=tourism_type)

        # Tìm địa điểm gần vị trí hiện tại
        if nearby and lat and lng:
            try:
                point = Point(float(lng), float(lat), srid=4326)
                queryset = queryset.filter(geom__isnull=False).annotate(
                    distance=Distance('geom', point)
                ).order_by('distance')
            except (ValueError, TypeError):
                pass

        return queryset[:limit]

# View chi tiết địa điểm
class LocationDetailView(generics.RetrieveAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

# View tất cả địa điểm
class AllLocationsView(generics.ListAPIView):
    serializer_class = LocationSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = Location.objects.all().order_by('id')
        tourism_type = self.request.query_params.get('tourism_type', None)
        nearby = self.request.query_params.get('nearby', None)
        lat = self.request.query_params.get('lat', None)
        lng = self.request.query_params.get('lng', None)

        if tourism_type:
            queryset = queryset.filter(tourism_type=tourism_type)

        if nearby and lat and lng:
            try:
                point = Point(float(lng), float(lat), srid=4326)
                queryset = queryset.filter(geom__isnull=False).annotate(
                    distance=Distance('geom', point)
                ).order_by('distance')
            except (ValueError, TypeError):
                pass

        return queryset

# View danh sách quận/huyện
class DistrictListView(generics.ListAPIView):
    queryset = District.objects.all().order_by('name')
    serializer_class = DistrictSerializer
    pagination_class = None

# View chi tiết quận/huyện
class DistrictDetailView(generics.RetrieveAPIView):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    lookup_field = 'name'