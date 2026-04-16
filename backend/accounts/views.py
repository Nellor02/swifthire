from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import EmployerApplication
from .serializers import (
    SeekerRegisterSerializer,
    EmployerApplicationRegisterSerializer,
    EmployerApplicationSerializer,
)


class SeekerRegisterAPIView(APIView):
    def post(self, request):
        serializer = SeekerRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Seeker account created successfully."},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployerApplyAPIView(APIView):
    def post(self, request):
        serializer = EmployerApplicationRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Employer application submitted successfully. Please wait for admin review."
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminEmployerApplicationListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != "admin":
            return Response(
                {"error": "Only admins can view employer applications."},
                status=status.HTTP_403_FORBIDDEN,
            )

        applications = EmployerApplication.objects.select_related("user").all()
        serializer = EmployerApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class AdminEmployerApplicationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if getattr(request.user, "role", None) != "admin":
            return Response(
                {"error": "Only admins can view employer application details."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = EmployerApplication.objects.select_related("user").get(pk=pk)
        except EmployerApplication.DoesNotExist:
            return Response(
                {"error": "Employer application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EmployerApplicationSerializer(application)
        return Response(serializer.data)


class AdminEmployerApplicationReviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if getattr(request.user, "role", None) != "admin":
            return Response(
                {"error": "Only admins can review employer applications."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = EmployerApplication.objects.select_related("user").get(pk=pk)
        except EmployerApplication.DoesNotExist:
            return Response(
                {"error": "Employer application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = str(request.data.get("status", "")).strip().lower()
        admin_notes = str(request.data.get("admin_notes", "")).strip()

        if new_status not in {"approved", "rejected"}:
            return Response(
                {"error": "Status must be either 'approved' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application.status = new_status
        application.admin_notes = admin_notes
        application.reviewed_at = timezone.now()
        application.save(update_fields=["status", "admin_notes", "reviewed_at"])

        serializer = EmployerApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)