from django.urls import path
from .views import (
    LocationListView, LocationDetailView, ItinerarySuggestionView, ItineraryUpdateView,
    AlternativeLocationsView, AllLocationsView, DistrictListView, DistrictDetailView,
    SignUpView, SignInView, RatingCreateView, RatingUpdateView, ItinerarySaveView,
    ItineraryListView, ItineraryDeleteView
)

urlpatterns = [
    path('api/locations/', LocationListView.as_view(), name='location-list'),
    path('api/locations/all/', AllLocationsView.as_view(), name='all-locations'),
    path('api/locations/<int:pk>/', LocationDetailView.as_view(), name='location-detail'),
    path('api/itinerary/suggest/', ItinerarySuggestionView.as_view(), name='itinerary-suggest'),
    path('api/itinerary/<int:pk>/update/', ItineraryUpdateView.as_view(), name='itinerary-update'),
    path('api/itinerary/<int:pk>/save/', ItinerarySaveView.as_view(), name='itinerary-save'),
    path('api/itineraries/', ItineraryListView.as_view(), name='itinerary-list'),
    path('api/itinerary/<int:pk>/delete/', ItineraryDeleteView.as_view(), name='itinerary-delete'),  # Endpoint mới
    path('api/locations/alternatives/<str:tourism_type>/', AlternativeLocationsView.as_view(), name='alternative-locations'),
    path('api/districts/', DistrictListView.as_view(), name='district-list'),
    path('api/districts/<str:name>/', DistrictDetailView.as_view(), name='district-detail'),
    path('api/auth/signup/', SignUpView.as_view(), name='signup'),
    path('api/auth/signin/', SignInView.as_view(), name='signin'),
    path('api/ratings/create/', RatingCreateView.as_view(), name='rating-create'),
    path('api/ratings/<int:pk>/update/', RatingUpdateView.as_view(), name='rating-update'),
]