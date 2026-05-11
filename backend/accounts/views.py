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
from .utils import (
    notify_admins_new_employer_application,
    notify_employer_application_review,
    send_platform_email,
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
            user = serializer.save()

            if user.email:
                send_platform_email(
                    subject="Welcome to SwiftHire",
                    message=(
                        f"Hello {user.username},\n\n"
                        f"Welcome to SwiftHire. Your seeker account has been created successfully.\n\n"
                        f"You can now:\n"
                        f"- Build your professional profile\n"
                        f"- Browse job opportunities\n"
                        f"- Apply to jobs\n"
                        f"- Connect with employers\n"
                        f"- Receive real-time updates and notifications\n\n"
                        f"We're excited to have you on SwiftHire."
                    ),
                    recipient_list=[user.email],
                    email_type="welcome",
                )

            return Response(
                {
                    "message": "Seeker account created successfully.",
                    "redirect_to": "/login?registered=1",
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployerApplyAPIView(APIView):
    def post(self, request):
        serializer = EmployerApplicationRegisterSerializer(data=request.data)

        if serializer.is_valid():
            application = serializer.save()

            notify_admins_new_employer_application(application)

            if application.user.email:
                send_platform_email(
                    subject="SwiftHire Employer Application Received",
                    message=(
                        f"Hello {application.user.username},\n\n"
                        f"Your employer application for {application.company_name} "
                        f"has been received and is currently pending review.\n\n"
                        f"You can log in to SwiftHire to track your application status.\n\n"
                        f"We will notify you once your application has been reviewed."
                    ),
                    recipient_list=[application.user.email],
                    email_type="support",
                )

            return Response(
                {
                    "message": "Employer application submitted successfully. Please wait for admin review.",
                    "redirect_to": "/login?employer_pending=1",
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
                    "pending_reminder_sent_at": None,
                    "legacy_account": True,
                },
                status=status.HTTP_200_OK,
            )


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

        application.save(
            update_fields=[
                "status",
                "admin_notes",
                "reviewed_at",
            ]
        )

        if new_status == "approved":
            user = application.user
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

        notify_employer_application_review(application)

        if application.user.email:
            if new_status == "approved":
                send_platform_email(
                    subject="SwiftHire Employer Application Approved",
                    message=(
                        f"Hello {application.user.username},\n\n"
                        f"Your employer application for {application.company_name} "
                        f"has been approved.\n\n"
                        f"You can now:\n"
                        f"- Create company profiles\n"
                        f"- Post jobs\n"
                        f"- Review applicants\n"
                        f"- Message candidates\n"
                        f"- Manage hiring workflows\n\n"
                        f"Welcome to SwiftHire."
                    ),
                    recipient_list=[application.user.email],
                    email_type="support",
                )

            else:
                send_platform_email(
                    subject="SwiftHire Employer Application Update",
                    message=(
                        f"Hello {application.user.username},\n\n"
                        f"Your employer application for {application.company_name} "
                        f"has been reviewed and was rejected.\n\n"
                        f"Admin notes:\n"
                        f"{application.admin_notes or 'No additional notes provided.'}"
                    ),
                    recipient_list=[application.user.email],
                    email_type="support",
                )

        serializer = EmployerApplicationSerializer(application)

        return Response(
            serializer.data,
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

        applications = (
            EmployerApplication.objects.select_related("user")
            .all()
            .order_by("-submitted_at")
        )

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

        notify_employer_application_review(application)

        if application.user.email:
            if new_status == "approved":
                send_platform_email(
                    subject="SwiftHire Employer Application Approved",
                    message=(
                        f"Hello {application.user.username},\n\n"
                        f"Your employer application for {application.company_name} "
                        f"has been approved.\n\n"
                        f"You can now log in and use your employer dashboard."
                    ),
                    recipient_list=[application.user.email],
                )
            else:
                send_platform_email(
                    subject="SwiftHire Employer Application Update",
                    message=(
                        f"Hello {application.user.username},\n\n"
                        f"Your employer application for {application.company_name} "
                        f"has been reviewed and was rejected.\n\n"
                        f"Admin notes: {application.admin_notes or 'No additional notes provided.'}"
                    ),
                    recipient_list=[application.user.email],
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