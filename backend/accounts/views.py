from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from applications.models import Application
from jobs.models import Job
from .models import EmployerApplication
from .serializers import (
    SeekerRegisterSerializer,
    EmployerApplicationRegisterSerializer,
    EmployerApplicationSerializer,
)

User = get_user_model()


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


class AdminAnalyticsOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != "admin":
            return Response(
                {"error": "Only admins can access analytics."},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = timezone.now()
        last_7_days = today - timedelta(days=7)
        last_30_days = today - timedelta(days=30)

        total_users = User.objects.count()
        total_seekers = User.objects.filter(role="seeker").count()
        total_employers = User.objects.filter(role="employer").count()
        total_admins = User.objects.filter(role="admin").count()

        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status="active").count()
        closed_jobs = Job.objects.filter(status="closed").count()
        draft_jobs = Job.objects.filter(status="draft").count()

        total_applications = Application.objects.count()
        pending_applications = Application.objects.filter(status="pending").count()
        reviewed_applications = Application.objects.filter(status="reviewed").count()
        accepted_applications = Application.objects.filter(status="accepted").count()
        rejected_applications = Application.objects.filter(status="rejected").count()

        employer_applications_total = EmployerApplication.objects.count()
        employer_pending = EmployerApplication.objects.filter(status="pending").count()
        employer_approved = EmployerApplication.objects.filter(status="approved").count()
        employer_rejected = EmployerApplication.objects.filter(status="rejected").count()

        recent_users_7d = User.objects.filter(date_joined__gte=last_7_days).count()
        recent_jobs_7d = Job.objects.filter(created_at__gte=last_7_days).count()
        recent_applications_7d = Application.objects.filter(created_at__gte=last_7_days).count()

        recent_users_30d = User.objects.filter(date_joined__gte=last_30_days).count()
        recent_jobs_30d = Job.objects.filter(created_at__gte=last_30_days).count()
        recent_applications_30d = Application.objects.filter(created_at__gte=last_30_days).count()

        top_companies = (
            Job.objects.values("company__name")
            .annotate(job_count=Count("id"))
            .order_by("-job_count", "company__name")[:5]
        )

        return Response(
            {
                "users": {
                    "total": total_users,
                    "seekers": total_seekers,
                    "employers": total_employers,
                    "admins": total_admins,
                    "last_7_days": recent_users_7d,
                    "last_30_days": recent_users_30d,
                },
                "jobs": {
                    "total": total_jobs,
                    "active": active_jobs,
                    "closed": closed_jobs,
                    "draft": draft_jobs,
                    "last_7_days": recent_jobs_7d,
                    "last_30_days": recent_jobs_30d,
                },
                "applications": {
                    "total": total_applications,
                    "pending": pending_applications,
                    "reviewed": reviewed_applications,
                    "accepted": accepted_applications,
                    "rejected": rejected_applications,
                    "last_7_days": recent_applications_7d,
                    "last_30_days": recent_applications_30d,
                },
                "employer_applications": {
                    "total": employer_applications_total,
                    "pending": employer_pending,
                    "approved": employer_approved,
                    "rejected": employer_rejected,
                },
                "top_companies": [
                    {
                        "company_name": item["company__name"] or "Unknown Company",
                        "job_count": item["job_count"],
                    }
                    for item in top_companies
                ],
            }
        )