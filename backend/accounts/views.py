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


class CurrentUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "role": getattr(request.user, "role", ""),
            }
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


class EmployerApplicationMeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != "employer":
            return Response(
                {"error": "Only employer accounts can access employer application status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = EmployerApplication.objects.select_related("user").get(
                user=request.user
            )
            serializer = EmployerApplicationSerializer(application)
            return Response(serializer.data)
        except EmployerApplication.DoesNotExist:
            return Response(
                {
                    "id": None,
                    "user": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                    "company_name": "Legacy Employer Account",
                    "company_email": request.user.email,
                    "company_phone": "",
                    "company_website": "",
                    "company_registration_number": "",
                    "company_address": "",
                    "business_description": "",
                    "contact_person_name": request.user.username,
                    "contact_person_position": "",
                    "supporting_note": "",
                    "status": "approved",
                    "admin_notes": "This is an existing employer account created before the employer application review workflow was introduced.",
                    "submitted_at": None,
                    "reviewed_at": None,
                    "legacy_account": True,
                },
                status=status.HTTP_200_OK,
            )


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

        if new_status == "approved":
            user = application.user

            if getattr(user, "role", None) != "employer":
                user.role = "employer"
                user.save(update_fields=["role"])

            from companies.models import Company

            company_exists = Company.objects.filter(owner=user).exists()

            if not company_exists:
                Company.objects.create(
                    owner=user,
                    name=application.company_name,
                    email=application.company_email,
                    phone=application.company_phone,
                    website=application.company_website,
                    address=application.company_address,
                    description=application.business_description,
                )

        serializer = EmployerApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)