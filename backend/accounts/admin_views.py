from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()


def admin_required(request):
    return getattr(request.user, "role", None) == "admin" or request.user.is_superuser


class AdminUserListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not admin_required(request):
            return Response(
                {"error": "Only admins can access users."},
                status=status.HTTP_403_FORBIDDEN,
            )

        search = request.query_params.get("search", "").strip()
        role = request.query_params.get("role", "").strip()

        users = User.objects.all().order_by("-date_joined")

        if search:
            users = users.filter(username__icontains=search) | users.filter(email__icontains=search)

        if role:
            users = users.filter(role=role)

        data = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "email_verified": getattr(user, "email_verified", False),
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "date_joined": user.date_joined,
            }
            for user in users
        ]

        return Response(data)


class AdminUserActionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if not admin_required(request):
            return Response(
                {"error": "Only admins can manage users."},
                status=status.HTTP_403_FORBIDDEN,
            )

        target_user = get_object_or_404(User, id=user_id)
        action = str(request.data.get("action", "")).strip().lower()

        if target_user.id == request.user.id and action in {"suspend", "delete", "demote"}:
            return Response(
                {"error": "You cannot perform this action on your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "suspend":
            target_user.is_active = False
            target_user.save(update_fields=["is_active"])
            return Response({"message": "User suspended successfully."})

        if action == "activate":
            target_user.is_active = True
            target_user.save(update_fields=["is_active"])
            return Response({"message": "User activated successfully."})

        if action == "promote_admin":
            target_user.role = "admin"
            target_user.is_staff = True
            target_user.is_superuser = True
            target_user.save(update_fields=["role", "is_staff", "is_superuser"])
            return Response({"message": "User promoted to admin successfully."})

        if action == "demote_admin":
            target_user.role = "seeker"
            target_user.is_staff = False
            target_user.is_superuser = False
            target_user.save(update_fields=["role", "is_staff", "is_superuser"])
            return Response({"message": "Admin demoted to seeker successfully."})

        if action == "verify_email":
            target_user.email_verified = True
            target_user.save(update_fields=["email_verified"])
            return Response({"message": "User email marked as verified."})

        return Response(
            {"error": "Invalid action."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, user_id):
        if not admin_required(request):
            return Response(
                {"error": "Only admins can delete users."},
                status=status.HTTP_403_FORBIDDEN,
            )

        target_user = get_object_or_404(User, id=user_id)

        if target_user.id == request.user.id:
            return Response(
                {"error": "You cannot delete your own account here."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = target_user.username
        target_user.delete()

        return Response({"message": f"User '{username}' deleted successfully."})