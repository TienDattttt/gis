# itinerary/serializers.py
from rest_framework import serializers
from .models import Location, Image, Itinerary, ItineraryLocation

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['id', 'url', 'caption', 'image_order']

class LocationSerializer(serializers.ModelSerializer):
    images = ImageSerializer(many=True, read_only=True)
    geom = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ['id', 'name', 'name_vi', 'tourism_type', 'geom', 'details', 'images']

    def get_geom(self, obj):
        if obj.geom:
            return {'lat': obj.geom.y, 'lng': obj.geom.x}
        return None

class ItineraryLocationSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)

    class Meta:
        model = ItineraryLocation
        fields = ['id', 'location', 'visit_order', 'day', 'estimated_time']

class ItinerarySerializer(serializers.ModelSerializer):
    locations = ItineraryLocationSerializer(many=True, read_only=True)

    class Meta:
        model = Itinerary
        fields = ['id', 'user', 'survey_data', 'created_at', 'updated_at', 'locations']