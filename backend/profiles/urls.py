from django.urls import path
from .views import (
    MySeekerProfileAPIView,
    TalentSearchAPIView,
    TalentProfileDetailAPIView,
    ContactTalentAPIView,
    ShortlistCandidateAPIView,
    EmployerShortlistAPIView,
    ConversationListAPIView,
    ConversationDetailAPIView,
    StartConversationAPIView,
    SendMessageAPIView,
    NotificationListAPIView,
    MarkNotificationReadAPIView,
    MarkAllNotificationsReadAPIView,
)

urlpatterns = [
    path("me/", MySeekerProfileAPIView.as_view(), name="my-seeker-profile"),
    path("talent/", TalentSearchAPIView.as_view(), name="talent-search"),
    path("talent/shortlist/", EmployerShortlistAPIView.as_view(), name="employer-shortlist"),
    path("talent/<int:pk>/", TalentProfileDetailAPIView.as_view(), name="talent-profile-detail"),
    path("talent/<int:pk>/contact/", ContactTalentAPIView.as_view(), name="contact-talent"),
    path("talent/<int:pk>/shortlist/", ShortlistCandidateAPIView.as_view(), name="shortlist-candidate"),

    path("messages/", ConversationListAPIView.as_view(), name="conversation-list"),
    path("messages/<int:pk>/", ConversationDetailAPIView.as_view(), name="conversation-detail"),
    path("talent/<int:pk>/start-conversation/", StartConversationAPIView.as_view(), name="start-conversation"),
    path("messages/<int:pk>/send/", SendMessageAPIView.as_view(), name="send-message"),

    path("notifications/", NotificationListAPIView.as_view(), name="notification-list"),
    path("notifications/read-all/", MarkAllNotificationsReadAPIView.as_view(), name="notifications-read-all"),
    path("notifications/<int:pk>/read/", MarkNotificationReadAPIView.as_view(), name="notification-read"),
]