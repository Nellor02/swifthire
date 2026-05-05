from rest_framework import serializers
from .models import (
    SeekerProfile,
    ShortlistedCandidate,
    Conversation,
    Message,
    Notification,
)


def get_user_profile_picture(user):
    try:
        profile = getattr(user, "seeker_profile", None)
        if profile and profile.profile_picture:
            return profile.profile_picture.url
    except Exception:
        return None

    return None


def get_user_company_logo(user):
    try:
        company = getattr(user, "company", None)
        if company and company.logo:
            return company.logo.url
    except Exception:
        return None

    return None


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
    sender_profile_picture = serializers.SerializerMethodField()
    sender_company_logo = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_username",
            "sender_role",
            "sender_profile_picture",
            "sender_company_logo",
            "sender_avatar",
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
            "sender_profile_picture",
            "sender_company_logo",
            "sender_avatar",
            "created_at",
            "is_read",
        ]

    def get_sender_profile_picture(self, obj):
        return get_user_profile_picture(obj.sender)

    def get_sender_company_logo(self, obj):
        return get_user_company_logo(obj.sender)

    def get_sender_avatar(self, obj):
        return get_user_profile_picture(obj.sender) or get_user_company_logo(obj.sender)


class ConversationListSerializer(serializers.ModelSerializer):
    employer_username = serializers.CharField(source="employer.username", read_only=True)
    seeker_username = serializers.CharField(source="seeker.username", read_only=True)
    candidate_profile = SeekerProfileSerializer(read_only=True)

    employer_logo = serializers.SerializerMethodField()
    seeker_profile_picture = serializers.SerializerMethodField()
    other_user_username = serializers.SerializerMethodField()
    other_user_role = serializers.SerializerMethodField()
    other_user_avatar = serializers.SerializerMethodField()

    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "employer",
            "employer_username",
            "employer_logo",
            "seeker",
            "seeker_username",
            "seeker_profile_picture",
            "candidate_profile",
            "other_user_username",
            "other_user_role",
            "other_user_avatar",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_employer_logo(self, obj):
        return get_user_company_logo(obj.employer)

    def get_seeker_profile_picture(self, obj):
        return get_user_profile_picture(obj.seeker)

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

    def get_other_user_avatar(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        if request.user.id == obj.employer_id:
            return get_user_profile_picture(obj.seeker)

        return get_user_company_logo(obj.employer)

    def get_last_message(self, obj):
        last_message = obj.messages.order_by("-created_at").first()
        if not last_message:
            return None

        return {
            "id": last_message.id,
            "body": last_message.body,
            "sender_username": last_message.sender.username,
            "sender_role": getattr(last_message.sender, "role", ""),
            "sender_profile_picture": get_user_profile_picture(last_message.sender),
            "sender_company_logo": get_user_company_logo(last_message.sender),
            "sender_avatar": get_user_profile_picture(last_message.sender)
            or get_user_company_logo(last_message.sender),
            "created_at": last_message.created_at,
        }

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()


class ConversationDetailSerializer(serializers.ModelSerializer):
    employer_username = serializers.CharField(source="employer.username", read_only=True)
    seeker_username = serializers.CharField(source="seeker.username", read_only=True)
    candidate_profile = SeekerProfileSerializer(read_only=True)

    employer_logo = serializers.SerializerMethodField()
    seeker_profile_picture = serializers.SerializerMethodField()
    other_user_username = serializers.SerializerMethodField()
    other_user_role = serializers.SerializerMethodField()
    other_user_avatar = serializers.SerializerMethodField()

    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "employer",
            "employer_username",
            "employer_logo",
            "seeker",
            "seeker_username",
            "seeker_profile_picture",
            "candidate_profile",
            "other_user_username",
            "other_user_role",
            "other_user_avatar",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_employer_logo(self, obj):
        return get_user_company_logo(obj.employer)

    def get_seeker_profile_picture(self, obj):
        return get_user_profile_picture(obj.seeker)

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

    def get_other_user_avatar(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None

        if request.user.id == obj.employer_id:
            return get_user_profile_picture(obj.seeker)

        return get_user_company_logo(obj.employer)


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