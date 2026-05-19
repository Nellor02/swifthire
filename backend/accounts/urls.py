from django.urls import path
from .views import (
    CurrentUserAPIView,
    VerifyEmailAPIView,
    ResendVerificationEmailAPIView,
    DeleteAccountAPIView,
    SeekerRegisterAPIView,
    EmployerApplyAPIView,
    EmployerApplicationMeAPIView,
    AdminEmployerApplicationListAPIView,
    AdminEmployerApplicationDetailAPIView,
    AdminEmployerApplicationReviewAPIView,
    AdminAnalyticsOverviewAPIView,
    ResendVerificationEmailAPIView,
)

urlpatterns = [
    path("me/", CurrentUserAPIView.as_view(), name="current-user"),

    path("verify-email/<uuid:token>/", VerifyEmailAPIView.as_view(), name="verify-email"),
    path("resend-verification-email/", ResendVerificationEmailAPIView.as_view(), name="resend-verification-email"),

    path("delete-account/", DeleteAccountAPIView.as_view(), name="delete-account"),

    path("register/seeker/", SeekerRegisterAPIView.as_view(), name="register-seeker"),
    path("register/employer/", EmployerApplyAPIView.as_view(), name="apply-employer"),

    path("employer-application/me/", EmployerApplicationMeAPIView.as_view(), name="employer-application-me"),

    path("admin/employer-applications/", AdminEmployerApplicationListAPIView.as_view(), name="admin-employer-application-list"),
    path("admin/employer-applications/<int:pk>/", AdminEmployerApplicationDetailAPIView.as_view(), name="admin-employer-application-detail"),
    path("admin/employer-applications/<int:pk>/review/", AdminEmployerApplicationReviewAPIView.as_view(), name="admin-employer-application-review"),

    path("admin/analytics/overview/", AdminAnalyticsOverviewAPIView.as_view(), name="admin-analytics-overview"),

    path(
    "resend-verification/", ResendVerificationEmailAPIView.as_view(), name="resend-verification"),
]