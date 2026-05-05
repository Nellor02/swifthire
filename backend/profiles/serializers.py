from rest_framework import serializers
from .models import (
    SeekerProfile,
    ShortlistedCandidate,
    Conversation,
    Message,
    Notification,
)


class SeekerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = SeekerProfile
        fields = [
            "id",
            "user",
            "username",
            "email",
            "full_name",
            "headline",
            "bio",
            "location",
            "phone",
            "skills",
            "experience_years",
            "education",
            "work_experience",
            "preferred_job_type",
            "preferred_location",
            "linkedin_url",
            "portfolio_url",
            "profile_picture",
            "is_public",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "username",
            "email",
            "created_at",
            "updated_at",
        ]


class ShortlistedCandidateSerializer(serializers.ModelSerializer):
    seeker_profile = SeekerProfileSerializer(read_only=True)

    class Meta:
        model = ShortlistedCandidate
        fields = [
            "id",
            "employer",
            "seeker_profile",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "employer",
            "seeker_profile",
            "created_at",
        ]


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    sender_role = serializers.CharField(source="sender.role", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_username",
            "sender_role",
            "body",
            "created_at",
            "is_read",
        ]
        read_only_fields = [
            "id",
            "conversation",
            "sender",
            "sender_username",
            "sender_role",
            "created_at",
            "is_read",
        ]


class ConversationListSerializer(serializers.ModelSerializer):
    employer_username = serializers.CharField(source="employer.username", read_only=True)
    seeker_username = serializers.CharField(source="seeker.username", read_only=True)
    candidate_profile = SeekerProfileSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user_username = serializers.SerializerMethodField()
    other_user_role = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "employer",
            "employer_username",
            "seeker",
            "seeker_username",
            "candidate_profile",
            "other_user_username",
            "other_user_role",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_last_message(self, obj):
        last_message = obj.messages.order_by("-created_at").first()
        if not last_message:
            return None

        return {
            "id": last_message.id,
            "body": last_message.body,
            "sender_username": last_message.sender.username,
            "created_at": last_message.created_at,
        }

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()

    def get_other_user_username(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return ""

        if request.user.id == obj.employer_id:
            return obj.seeker.username

        return obj.employer.username

    def get_other_user_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return ""

        if request.user.id == obj.employer_id:
            return getattr(obj.seeker, "role", "seeker")

        return getattr(obj.employer, "role", "employer")


class ConversationDetailSerializer(serializers.ModelSerializer):
    employer_username = serializers.CharField(source="employer.username", read_only=True)
    seeker_username = serializers.CharField(source="seeker.username", read_only=True)
    candidate_profile = SeekerProfileSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "employer",
            "employer_username",
            "seeker",
            "seeker_username",
            "candidate_profile",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    action_url = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "type",
            "title",
            "message",
            "is_read",
            "target_id",
            "target_url",
            "action_url",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "type",
            "title",
            "message",
            "target_id",
            "target_url",
            "action_url",
            "created_at",
        ]

    def get_action_url(self, obj):
        if obj.target_url:
            return obj.target_url

        if obj.type == "message" and obj.target_id:
            return f"/messages/{obj.target_id}"

        if obj.type == "shortlist":
            return "/profile/preview"

        if obj.type == "status_update":
            return "/my-applications"

        return "/notifications"