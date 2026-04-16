from django.urls import path
from .views import (
    MyApplicationsAPIView,
    SeekerApplicationDetailAPIView,
    ApplyToJobAPIView,
    EmployerJobApplicationsAPIView,
    EmployerApplicationDetailAPIView,
    UpdateApplicationStatusAPIView,
    UpdateApplicationNotesAPIView,
    EmployerAcceptedCandidatesAPIView,
    SeekerDashboardStatsAPIView,
)

urlpatterns = [
    path("my/", MyApplicationsAPIView.as_view(), name="my-applications"),
    path("my/<int:pk>/", SeekerApplicationDetailAPIView.as_view(), name="my-application-detail"),
    path("jobs/<int:job_id>/apply/", ApplyToJobAPIView.as_view(), name="apply-to-job"),
    path("jobs/<int:job_id>/applicants/", EmployerJobApplicationsAPIView.as_view(), name="employer-job-applicants"),
    path("employer/<int:pk>/", EmployerApplicationDetailAPIView.as_view(), name="employer-application-detail"),
    path("employer/accepted/", EmployerAcceptedCandidatesAPIView.as_view(), name="employer-accepted-candidates"),
    path("seeker/dashboard/stats/", SeekerDashboardStatsAPIView.as_view(), name="seeker-dashboard-stats"),
    path("<int:application_id>/status/", UpdateApplicationStatusAPIView.as_view(), name="update-application-status"),
    path("<int:application_id>/notes/", UpdateApplicationNotesAPIView.as_view(), name="update-application-notes"),
] 