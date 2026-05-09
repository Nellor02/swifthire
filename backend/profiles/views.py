from django.conf import settings
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import (
    SeekerProfile,
    ShortlistedCandidate,
    Conversation,
    Message,
    Notification,
)
from .serializers import (
    SeekerProfileSerializer,
    ShortlistedCandidateSerializer,
    ConversationListSerializer,
    ConversationDetailSerializer,
    MessageSerializer,
    NotificationSerializer,
)


def send_notification_email(user, title, message, action_url=""):
    recipient_email = getattr(user, "email", "").strip()

    if not recipient_email:
        return

    site_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
    full_action_url = (
        f"{site_url}{action_url}"
        if site_url and action_url.startswith("/")
        else action_url
    )

    email_body = message or title

    if full_action_url:
        email_body += f"\n\nOpen this notification:\n{full_action_url}"

    send_mail(
        subject=title,
        message=email_body,
        from_email=None,
        recipient_list=[recipient_email],
        fail_silently=False,
    )


def create_notification(
    user,
    notification_type,
    title,
    message="",
    target_id=None,
    target_url="",
):
    notification = Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        message=message,
        target_id=target_id,
        target_url=target_url or "",
    )

    send_notification_email(
        user=user,
        title=title,
        message=message or title,
        action_url=target_url or "",
    )

    return notification
def serialize_message_for_realtime(message):
    return {
        "id": message.id,
        "sender": message.sender_id,
        "sender_username": message.sender.username,
        "sender_role": getattr(message.sender, "role", ""),
        "sender_avatar": "",
        "sender_profile_picture": "",
        "sender_company_logo": "",
        "body": message.body,
        "created_at": message.created_at.isoformat(),
        "is_read": message.is_read,
    }


def broadcast_to_conversation(conversation_id, event):
    channel_layer = get_channel_layer()

    if not channel_layer:
        return

    async_to_sync(channel_layer.group_send)(
        f"chat_{conversation_id}",
        event,
    )


def get_conversation_for_user_or_404(request, pk):
    try:
        conversation = (
            Conversation.objects.select_related(
                "employer",
                "seeker",
                "candidate_profile",
                "candidate_profile__user",
            )
            .prefetch_related("messages__sender")
            .get(pk=pk)
        )
    except Conversation.DoesNotExist:
        return None, Response(
            {"error": "Conversation not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    user_role = getattr(request.user, "role", None)
    is_participant = (
        request.user.id == conversation.employer_id
        or request.user.id == conversation.seeker_id
        or user_role == "admin"
    )

    if not is_participant:
        return None, Response(
            {"error": "You do not have permission to access this conversation."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return conversation, None


class MySeekerProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can access seeker profiles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = SeekerProfile.objects.get(user=request.user)
        except SeekerProfile.DoesNotExist:
            return Response(
                {"error": "Profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SeekerProfileSerializer(profile)
        return Response(serializer.data)

    def post(self, request):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can create seeker profiles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if SeekerProfile.objects.filter(user=request.user).exists():
            return Response(
                {"error": "Profile already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SeekerProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can update seeker profiles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = SeekerProfile.objects.get(user=request.user)
        except SeekerProfile.DoesNotExist:
            return Response(
                {"error": "Profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SeekerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TalentSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can search talent."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = (
            SeekerProfile.objects.filter(is_public=True)
            .select_related("user")
            .order_by("-updated_at")
        )

        search = request.query_params.get("search", "").strip()
        location = request.query_params.get("location", "").strip()
        job_type = request.query_params.get("job_type", "").strip()
        min_experience = request.query_params.get("min_experience", "").strip()

        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search)
                | Q(headline__icontains=search)
                | Q(bio__icontains=search)
                | Q(skills__icontains=search)
                | Q(education__icontains=search)
                | Q(work_experience__icontains=search)
            )

        if location:
            queryset = queryset.filter(location__icontains=location)

        if job_type:
            queryset = queryset.filter(preferred_job_type=job_type)

        if min_experience:
            try:
                queryset = queryset.filter(experience_years__gte=int(min_experience))
            except ValueError:
                pass

        page_number = request.query_params.get("page", 1)
        paginator = Paginator(queryset, 6)
        page = paginator.get_page(page_number)
        serializer = SeekerProfileSerializer(page.object_list, many=True)

        return Response(
            {
                "results": serializer.data,
                "total": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page.number,
                "has_next": page.has_next(),
                "has_previous": page.has_previous(),
            }
        )


class TalentProfileDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can view talent profiles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = SeekerProfile.objects.select_related("user").get(
                pk=pk,
                is_public=True,
            )
        except SeekerProfile.DoesNotExist:
            return Response(
                {"error": "Talent profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SeekerProfileSerializer(profile)
        return Response(serializer.data)


class ContactTalentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can contact candidates."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = SeekerProfile.objects.select_related("user").get(
                pk=pk,
                is_public=True,
            )
        except SeekerProfile.DoesNotExist:
            return Response(
                {"error": "Talent profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        subject = request.data.get("subject", "").strip()
        message = request.data.get("message", "").strip()

        if not subject:
            return Response(
                {"error": "Subject is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not message:
            return Response(
                {"error": "Message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient_email = getattr(profile.user, "email", "").strip()
        if not recipient_email:
            return Response(
                {"error": "This candidate does not have a contact email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sender_name = getattr(request.user, "username", "Employer")
        sender_email = getattr(request.user, "email", "")

        full_message = (
            f"Message from SwiftHire employer/admin: {sender_name}\n"
            f"Sender email: {sender_email or 'Not provided'}\n\n"
            f"Candidate: {profile.full_name}\n\n"
            f"{message}"
        )

        send_mail(
            subject=subject,
            message=full_message,
            from_email=None,
            recipient_list=[recipient_email],
            fail_silently=False,
        )

        create_notification(
            user=profile.user,
            notification_type="contact",
            title="An employer contacted you",
            message=f"{sender_name} sent you an email through SwiftHire.",
            target_id=profile.id,
            target_url="/profile/preview",
        )

        return Response(
            {"message": "Message sent successfully."},
            status=status.HTTP_200_OK,
        )


class ShortlistCandidateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can shortlist candidates."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = SeekerProfile.objects.select_related("user").get(
                pk=pk,
                is_public=True,
            )
        except SeekerProfile.DoesNotExist:
            return Response(
                {"error": "Talent profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        shortlist, created = ShortlistedCandidate.objects.get_or_create(
            employer=request.user,
            seeker_profile=profile,
        )

        if not created:
            return Response(
                {"error": "Candidate is already shortlisted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        create_notification(
            user=profile.user,
            notification_type="shortlist",
            title="You were shortlisted",
            message=f"{request.user.username} shortlisted your profile.",
            target_id=profile.id,
            target_url="/profile/preview",
        )

        serializer = ShortlistedCandidateSerializer(shortlist)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can manage shortlists."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = SeekerProfile.objects.get(pk=pk)
        except SeekerProfile.DoesNotExist:
            return Response(
                {"error": "Talent profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            shortlist = ShortlistedCandidate.objects.get(
                employer=request.user,
                seeker_profile=profile,
            )
        except ShortlistedCandidate.DoesNotExist:
            return Response(
                {"error": "Candidate is not in your shortlist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        shortlist.delete()
        return Response(
            {"message": "Candidate removed from shortlist."},
            status=status.HTTP_200_OK,
        )


class EmployerShortlistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can view shortlists."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = ShortlistedCandidate.objects.filter(
            employer=request.user
        ).select_related("seeker_profile", "seeker_profile__user")

        serializer = ShortlistedCandidateSerializer(queryset, many=True)
        return Response(serializer.data)


class ConversationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = getattr(request.user, "role", None)

        if user_role == "employer":
            conversations = Conversation.objects.filter(employer=request.user)
        elif user_role == "seeker":
            conversations = Conversation.objects.filter(seeker=request.user)
        elif user_role == "admin":
            conversations = Conversation.objects.all()
        else:
            return Response(
                {"error": "You are not allowed to access conversations."},
                status=status.HTTP_403_FORBIDDEN,
            )

        conversations = conversations.select_related(
            "employer",
            "seeker",
            "candidate_profile",
            "candidate_profile__user",
        ).prefetch_related("messages", "messages__sender")

        serializer = ConversationListSerializer(
            conversations,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class ConversationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        conversation, error_response = get_conversation_for_user_or_404(request, pk)

        if error_response:
            return error_response

        unread_messages = conversation.messages.filter(
            is_read=False
        ).exclude(sender=request.user)

        marked_read_count = unread_messages.update(is_read=True)

        if marked_read_count > 0:
            broadcast_to_conversation(
                conversation.id,
                {
                    "type": "messages_read",
                    "conversation_id": conversation.id,
                    "reader_username": request.user.username,
                    "marked_read_count": marked_read_count,
                },
            )

        serializer = ConversationDetailSerializer(
            conversation,
            context={"request": request},
        )

        unread_conversation_count = (
            Conversation.objects.filter(seeker=request.user)
            if getattr(request.user, "role", None) == "seeker"
            else Conversation.objects.filter(employer=request.user)
        )

        unread_total = 0
        for item in unread_conversation_count.prefetch_related("messages"):
            unread_total += item.messages.filter(is_read=False).exclude(
                sender=request.user
            ).count()

        return Response(
            {
                "conversation": serializer.data,
                "marked_read_count": marked_read_count,
                "unread_total": unread_total,
            }
        )


class StartConversationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can start conversations."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            profile = SeekerProfile.objects.select_related("user").get(
                pk=pk,
                is_public=True,
            )
        except SeekerProfile.DoesNotExist:
            return Response(
                {"error": "Talent profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        conversation, created = Conversation.objects.get_or_create(
            employer=request.user,
            seeker=profile.user,
            defaults={"candidate_profile": profile},
        )

        if not created and conversation.candidate_profile_id != profile.id:
            conversation.candidate_profile = profile
            conversation.save(update_fields=["candidate_profile", "updated_at"])

        if created:
            create_notification(
                user=profile.user,
                notification_type="message",
                title="New conversation started",
                message=f"{request.user.username} started a conversation with you.",
                target_id=conversation.id,
                target_url=f"/messages/{conversation.id}",
            )

        serializer = ConversationDetailSerializer(
            conversation,
            context={"request": request},
        )
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class SendMessageAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        conversation, error_response = get_conversation_for_user_or_404(request, pk)

        if error_response:
            return error_response

        body = request.data.get("body", "").strip()
        if not body:
            return Response(
                {"error": "Message body is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=body,
        )

        receiver = (
            conversation.seeker
            if request.user.id == conversation.employer_id
            else conversation.employer
        )

        create_notification(
            user=receiver,
            notification_type="message",
            title="New message",
            message=f"{request.user.username} sent you a message.",
            target_id=conversation.id,
            target_url=f"/messages/{conversation.id}",
        )

        conversation.save(update_fields=["updated_at"])

        realtime_message = serialize_message_for_realtime(message)

        broadcast_to_conversation(
            conversation.id,
            {
                "type": "chat_message",
                "message": realtime_message,
            },
        )

        return Response(realtime_message, status=status.HTTP_201_CREATED)

class NotificationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        unread_count = notifications.filter(is_read=False).count()

        return Response(
            {
                "results": serializer.data,
                "unread_count": unread_count,
            }
        )


class MarkNotificationReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])

        serializer = NotificationSerializer(notification)
        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response(
            {
                "notification": serializer.data,
                "unread_count": unread_count,
            }
        )


class MarkAllNotificationsReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(is_read=True)

        return Response(
            {
                "message": "All notifications marked as read.",
                "unread_count": 0,
            },
            status=status.HTTP_200_OK,
        )