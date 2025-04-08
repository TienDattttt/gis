from rest_framework import generics
from rest_framework.response import Response
from django.db.models import Q
from .models import Location, Itinerary, ItineraryLocation
from .serializers import LocationSerializer, ItinerarySerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from rest_framework import status

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
        queryset = Location.objects.all()
        search_query = self.request.query_params.get('search', None)
        tag = self.request.query_params.get('tag', None)

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(details__title__icontains=search_query) |
                Q(details__short_description__icontains=search_query)
            )

        if tag:
            queryset = queryset.filter(tourism_type__iexact=tag)

        return queryset

    def list(self, request, *args, **kwargs):
        if request.query_params.get('all') == 'true':
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        return super().list(request, *args, **kwargs)

class LocationDetailView(generics.RetrieveAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer