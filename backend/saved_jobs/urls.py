from django.urls import path
from .views import SavedJobsAPIView, ToggleSavedJobAPIView

urlpatterns = [
    path("", SavedJobsAPIView.as_view(), name="saved-jobs-list"),
    path("<int:job_id>/", ToggleSavedJobAPIView.as_view(), name="toggle-saved-job"),
]