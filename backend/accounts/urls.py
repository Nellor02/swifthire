from django.urls import path
from .views import (
    CurrentUserAPIView,
    SeekerRegisterAPIView,
    EmployerApplyAPIView,
    EmployerApplicationMeAPIView,
    AdminEmployerApplicationListAPIView,
    AdminEmployerApplicationDetailAPIView,
    AdminEmployerApplicationReviewAPIView,
    AdminAnalyticsOverviewAPIView,
)

urlpatterns = [
    path("me/", CurrentUserAPIView.as_view(), name="current-user"),
    path("register/seeker/", SeekerRegisterAPIView.as_view(), name="register-seeker"),
    path("register/employer/", EmployerApplyAPIView.as_view(), name="apply-employer"),
    path("employer-application/me/", EmployerApplicationMeAPIView.as_view(), name="employer-application-me"),
    path("admin/employer-applications/", AdminEmployerApplicationListAPIView.as_view(), name="admin-employer-application-list"),
    path("admin/employer-applications/<int:pk>/", AdminEmployerApplicationDetailAPIView.as_view(), name="admin-employer-application-detail"),
    path("admin/employer-applications/<int:pk>/review/", AdminEmployerApplicationReviewAPIView.as_view(), name="admin-employer-application-review"),
    path("admin/analytics/overview/", AdminAnalyticsOverviewAPIView.as_view(), name="admin-analytics-overview"),
]