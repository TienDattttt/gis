# itinerary/serializers.py
from rest_framework import serializers
from .models import Location, Image, Itinerary, ItineraryLocation, District,Rating

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['id', 'url', 'caption', 'image_order']

class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)  # Hiển thị username
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all())

    class Meta:
        model = Rating
        fields = ['id', 'user', 'location', 'score', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

class LocationSerializer(serializers.ModelSerializer):
    images = ImageSerializer(many=True, read_only=True)
    ratings = RatingSerializer(many=True, read_only=True)
    geom = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ['id', 'name', 'name_vi', 'tourism_type', 'geom', 'details', 'images', 'embed_url','ratings']

    def get_geom(self, obj):
        if obj.geom:
            return {'lat': obj.geom.y, 'lng': obj.geom.x}
        return None
    
    def get_average_rating(self, obj):
        ratings = obj.ratings.all()
        if ratings.exists():
            return round(sum(r.score for r in ratings) / ratings.count(), 1)
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

class DistrictSerializer(serializers.ModelSerializer):
    geom = serializers.SerializerMethodField()

    class Meta:
        model = District
        fields = ['id', 'name', 'geom']

    def get_geom(self, obj):
        if obj.geom:
            return obj.geom.geojson
        return None
    
