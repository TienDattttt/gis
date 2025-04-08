from django.urls import path
from .views import LocationListView, LocationDetailView, ItinerarySuggestionView, ItineraryUpdateView, AlternativeLocationsView

urlpatterns = [
    path('api/locations/', LocationListView.as_view(), name='location-list'),
    path('api/locations/<int:pk>/', LocationDetailView.as_view(), name='location-detail'),
    path('api/itinerary/suggest/', ItinerarySuggestionView.as_view(), name='itinerary-suggest'),
    path('api/itinerary/<int:pk>/update/', ItineraryUpdateView.as_view(), name='itinerary-update'),
    path('api/locations/alternatives/<str:tourism_type>/', AlternativeLocationsView.as_view(), name='alternative-locations'),
]