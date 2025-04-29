from django.forms import ValidationError
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
from rest_framework.pagination import PageNumberPagination


# Authentication
# Đăng ký
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

# Đăng nhập
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


# Location
# Danh sách địa điểm
class LocationListView(generics.ListAPIView):
    serializer_class = LocationSerializer
    pagination_class = PageNumberPagination

    def paginate_queryset(self, queryset):
        if self.request.query_params.get('all', '').lower() == 'true':
            return None
        return super().paginate_queryset(queryset)

    def get_queryset(self):
        queryset = Location.objects.all().order_by('id')
        params = self.request.query_params

        search_query = params.get('search')
        tourism_type = params.get('tourism_type')
        nearby = params.get('nearby')
        lat = params.get('lat')
        lng = params.get('lng')
        district = params.get('district')
        radius_km = params.get('radius')

        if district:
            district_obj = District.objects.filter(name=district).first()
            if district_obj:
                queryset = queryset.filter(geom__within=district_obj.geom)

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(name_vi__icontains=search_query) |
                Q(details__icontains=search_query)
            )

        if tourism_type:
            queryset = queryset.filter(tourism_type=tourism_type)

        if nearby and lat and lng:
            try:
                point = Point(float(lng), float(lat), srid=4326)
            except ValueError:
                raise ValidationError("Invalid latitude/longitude format.")

            queryset = queryset.filter(geom__isnull=False)

            if radius_km:
                try:
                    radius_m = float(radius_km) * 1000
                    queryset = queryset.filter(geom__dwithin=(point, radius_m / 111000))
                except ValueError:
                    raise ValidationError("Invalid radius format. Must be a number.")

            queryset = queryset.annotate(distance=Distance('geom', point)).order_by('distance')

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page if page is not None else queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

# Chi tiết địa điểm
class LocationDetailView(generics.RetrieveAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    
# thay đổi địa điểm trong lịch trình
class AlternativeLocationsView(APIView):
    def get(self, request, tourism_type):
        locations = Location.objects.filter(tourism_type=tourism_type)
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)

# Itinerary
# Gợi ý lịch trình
class ItinerarySuggestionView(APIView):
    def post(self, request):
        days = request.data.get('days', 1)
        current_lat = request.data.get('latitude')
        current_lng = request.data.get('longitude')
        tourism_types = ['viewpoint', 'museum', 'attraction', 'theme_park']

        # Validate dữ liệu đầu vào
        if current_lat is None or current_lng is None:
            return Response({"error": "Current location (latitude and longitude) is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            days = int(days)
            current_lat = float(current_lat)
            current_lng = float(current_lng)
            if days < 1 or days > 3:
                return Response({"error": "Days must be between 1 and 3"}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({"error": "Invalid input for days, latitude, or longitude"}, status=status.HTTP_400_BAD_REQUEST)

        # Tạo Point
        current_location = Point(current_lng, current_lat, srid=4326)

        # Lấy danh sách địa điểm
        all_locations = Location.objects.filter(
            tourism_type__in=tourism_types,
            geom__isnull=False
        ).annotate(
            distance=Distance('geom', current_location)
        ).order_by('distance')

        if not all_locations.exists():
            return Response({"error": "No available locations found"}, status=status.HTTP_404_NOT_FOUND)

        # Phân bổ địa điểm cho từng ngày
        itinerary_locations = []
        used_location_ids = set()
        locations_per_day = len(tourism_types)  #Xác định số lượng địa điểm cần chọn mỗi ngày (có 4 loại du lịch, vậy mỗi ngày sẽ chọn 4 địa điểm).
        available_locations = list(all_locations)

        for day in range(1, days + 1):
            day_locations = []
            for tourism_type in tourism_types:
                for loc in available_locations:
                    if loc.id not in used_location_ids and loc.tourism_type == tourism_type:
                        day_locations.append(loc)
                        used_location_ids.add(loc.id)
                        break

            if len(day_locations) != locations_per_day:
                return Response({"error": f"Not enough locations for day {day}"}, status=status.HTTP_404_NOT_FOUND)

            # Sắp xếp trong ngày theo khoảng cách
            day_locations.sort(key=lambda loc: loc.distance.m)

            for idx, loc in enumerate(day_locations, 1):
                itinerary_locations.append(ItineraryLocation(
                    location=loc,
                    visit_order=idx,
                    day=day,
                    estimated_time="01:00:00"
                ))

        # Tạo itinerary
        itinerary = Itinerary.objects.create(
            survey_data={
                "days": days,
                "current_location": {"lat": current_lat, "lng": current_lng}
            },
            user=request.user if request.user.is_authenticated else None
        )

        # Bulk create ItineraryLocation
        for loc in itinerary_locations:
            loc.itinerary = itinerary
        ItineraryLocation.objects.bulk_create(itinerary_locations)

        # Serialize và trả về
        serializer = ItinerarySerializer(itinerary)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
# View lấy danh sách lịch trình của người dùng
class ItineraryListView(generics.ListAPIView):
    serializer_class = ItinerarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Itinerary.objects.filter(user=self.request.user).order_by('-created_at')
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
# Rating
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

# District
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
