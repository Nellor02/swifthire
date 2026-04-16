from django.contrib import admin
from .models import Notification
from .models import (
    SeekerProfile,
    ShortlistedCandidate,
    Conversation,
    Message,
)


@admin.register(SeekerProfile)
class SeekerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "full_name",
        "headline",
        "location",
        "experience_years",
        "preferred_job_type",
        "is_public",
        "updated_at",
    )
    list_filter = ("is_public", "preferred_job_type", "location")
    search_fields = (
        "user__username",
        "full_name",
        "headline",
        "location",
        "skills",
    )
    readonly_fields = ("created_at", "updated_at")


@admin.register(ShortlistedCandidate)
class ShortlistedCandidateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employer",
        "seeker_profile",
        "created_at",
    )
    search_fields = (
        "employer__username",
        "seeker_profile__full_name",
        "seeker_profile__user__username",
    )
    readonly_fields = ("created_at",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employer",
        "seeker",
        "candidate_profile",
        "updated_at",
        "created_at",
    )
    search_fields = (
        "employer__username",
        "seeker__username",
        "candidate_profile__full_name",
    )
    readonly_fields = ("created_at", "updated_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "conversation",
        "sender",
        "is_read",
        "created_at",
    )
    search_fields = (
        "sender__username",
        "body",
    )
    list_filter = ("is_read", "created_at")
    readonly_fields = ("created_at",)
    
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "type", "is_read", "created_at")
    list_filter = ("type", "is_read")
    search_fields = ("user__username", "title", "message")