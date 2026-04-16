from django.urls import path
from .views import (
    JobListCreateAPIView,
    JobDetailAPIView,
    EmployerJobListAPIView,
    EmployerDashboardStatsAPIView,
)

urlpatterns = [
    path("", JobListCreateAPIView.as_view(), name="job-list-create"),
    path("employer/", EmployerJobListAPIView.as_view(), name="employer-job-list"),
    path("dashboard/stats/", EmployerDashboardStatsAPIView.as_view(), name="employer-dashboard-stats"),
    path("<int:pk>/", JobDetailAPIView.as_view(), name="job-detail"),
    path("<int:pk>/delete/", JobDetailAPIView.as_view(), name="job-delete"),
]