from rest_framework import generics
from rest_framework.response import Response
from django.db.models import Q
from .models import Location, Itinerary, ItineraryLocation, District
from .serializers import LocationSerializer, ItinerarySerializer,DistrictSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from rest_framework import status
from django.contrib.gis.measure import D

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
        locations_per_day = len(tourism_types)  # Số địa điểm mỗi ngày (4 loại hình du lịch)

        # Chia danh sách địa điểm thành các ngày
        available_locations = list(all_locations)
        for day in range(1, days + 1):
            # Lấy các địa điểm cho ngày hiện tại
            day_locations = []
            for tourism_type in tourism_types:
                # Tìm địa điểm gần nhất chưa được sử dụng cho loại hình du lịch này
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

            # Sắp xếp các địa điểm trong ngày theo khoảng cách từ vị trí hiện tại
            day_locations.sort(key=lambda loc: loc.distance.m)  # Sắp xếp theo khoảng cách (mét)

            # Gán visit_order dựa trên khoảng cách
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

class ItineraryUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            itinerary = Itinerary.objects.get(pk=pk)
            if itinerary.user != request.user:
                return Response({"error": "You do not own this itinerary"}, status=status.HTTP_403_FORBIDDEN)
        except Itinerary.DoesNotExist:
            return Response({"error": "Itinerary not found"}, status=status.HTTP_404_NOT_FOUND)

        # Thay đổi địa điểm
        location_id_to_change = request.data.get('location_id')
        new_location_id = request.data.get('new_location_id')

        if location_id_to_change and new_location_id:
            try:
                itinerary_location = ItineraryLocation.objects.get(
                    itinerary=itinerary, 
                    location_id=location_id_to_change
                )
                new_location = Location.objects.get(id=new_location_id)
                
                if new_location.tourism_type != itinerary_location.location.tourism_type:
                    return Response({"error": "New location must match the original tourism type"}, 
                                  status=status.HTTP_400_BAD_REQUEST)
                
                if new_location.id in [loc.location.id for loc in itinerary.locations.all()]:
                    return Response({"error": "This location is already in the itinerary"}, 
                                  status=status.HTTP_400_BAD_REQUEST)

                itinerary_location.location = new_location
                itinerary_location.save()

            except (ItineraryLocation.DoesNotExist, Location.DoesNotExist):
                return Response({"error": "Invalid location"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ItinerarySerializer(itinerary)
        return Response(serializer.data)

class AlternativeLocationsView(APIView):
    def get(self, request, tourism_type):
        locations = Location.objects.filter(tourism_type=tourism_type)
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)

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
                print(f"Queryset for district {district}: {queryset.count()} locations found")  # Debug
            except District.DoesNotExist:
                print(f"District {district} not found")
                queryset = queryset.none()  # Trả về tập hợp rỗng nếu quận không tồn tại

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
    
class LocationDetailView(generics.RetrieveAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer


class AllLocationsView(generics.ListAPIView):
    serializer_class = LocationSerializer
    pagination_class = None  # Tắt phân trang

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
    
class DistrictListView(generics.ListAPIView):
    queryset = District.objects.all().order_by('name')
    serializer_class = DistrictSerializer
    pagination_class = None

#để lấy ranh giới của một quận cụ thể
class DistrictDetailView(generics.RetrieveAPIView):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    lookup_field = 'name'  # Sử dụng name thay vì id để tra cứu