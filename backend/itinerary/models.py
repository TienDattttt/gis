from django.db import models
from django.contrib.gis.db import models as gis_models
from django.db.models import JSONField  # Thay đổi import
from django.contrib.auth.models import User

class Location(gis_models.Model):
    id = models.BigIntegerField(primary_key=True)
    type = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=255)
    name_vi = models.CharField(max_length=255, blank=True, null=True)
    tourism_type = models.CharField(max_length=50)
    geom = gis_models.PointField(srid=4326, blank=True, null=True)
    details = JSONField(blank=True, null=True)  # Sử dụng JSONField từ django.db.models

    class Meta:
        managed = True
        db_table = 'locations'

    def __str__(self):
        return self.name

class Image(models.Model):
    id = models.AutoField(primary_key=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='images')
    url = models.TextField()
    caption = models.TextField(blank=True, null=True)
    image_order = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'images'

    def __str__(self):
        return f"Image for {self.location.name} - Order {self.image_order}"

class Itinerary(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='itineraries',null=True)
    survey_data = JSONField(blank=True, null=True)  # Sử dụng JSONField từ django.db.models
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'itineraries'

    def __str__(self):
        return f"Itinerary {self.id} by {self.user.username}"

class ItineraryLocation(models.Model):
    id = models.AutoField(primary_key=True)
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name='locations')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='itinerary_locations')
    visit_order = models.IntegerField()
    day = models.IntegerField(default=1)
    estimated_time = models.DurationField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'itinerary_locations'
        unique_together = ('itinerary', 'location')

    def __str__(self):
        return f"{self.location.name} in Itinerary {self.itinerary.id} (Day {self.day}, Order: {self.visit_order})"