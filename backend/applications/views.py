from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from jobs.models import Job
from .models import Application
from .serializers import ApplicationSerializer
from profiles.models import Notification


class MyApplicationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        applications = (
            Application.objects
            .filter(applicant=request.user)
            .select_related("job", "applicant", "job__company")
        )
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class SeekerApplicationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can view application details."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = (
                Application.objects
                .select_related("job", "job__company", "applicant")
                .get(pk=pk, applicant=request.user)
            )
        except Application.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ApplicationSerializer(application)
        return Response(serializer.data)


class ApplyToJobAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, job_id):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can apply for jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            job = Job.objects.get(id=job_id, status="active")
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if Application.objects.filter(job=job, applicant=request.user).exists():
            return Response(
                {"error": "You have already applied for this job."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cover_letter = request.data.get("cover_letter", "").strip()
        cv_file = request.FILES.get("cv")

        if cv_file and not cv_file.name.lower().endswith(".pdf"):
            return Response(
                {"error": "Only PDF CV files are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application = Application.objects.create(
            job=job,
            applicant=request.user,
            cover_letter=cover_letter,
            cv=cv_file,
        )

        company_owner = getattr(job.company, "owner", None)
        if company_owner:
            Notification.objects.create(
                user=company_owner,
                type="application",
                title="New job application",
                message=f"{request.user.username} applied for {job.title}.",
                target_id=job.id,
            )

        serializer = ApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EmployerJobApplicationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can view applicants."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            job = Job.objects.select_related("company").get(id=job_id)
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(job.company, "owner_id", None) != request.user.id and getattr(request.user, "role", None) != "admin":
            return Response(
                {"error": "You do not have permission to view applicants for this job."},
                status=status.HTTP_403_FORBIDDEN,
            )

        applications = (
            Application.objects
            .filter(job=job)
            .select_related("job", "applicant", "job__company")
        )
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class EmployerApplicationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            application = (
                Application.objects
                .select_related("job__company", "applicant")
                .get(pk=pk)
            )
        except Application.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Not authorized."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(request.user, "role", None) != "admin":
            if getattr(application.job.company, "owner_id", None) != request.user.id:
                return Response(
                    {"error": "You do not have access to this application."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = ApplicationSerializer(application)
        return Response(serializer.data)


class UpdateApplicationStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, application_id):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can update application status."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = (
                Application.objects
                .select_related("job", "applicant", "job__company")
                .get(id=application_id)
            )
        except Application.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            getattr(application.job.company, "owner_id", None) != request.user.id
            and getattr(request.user, "role", None) != "admin"
        ):
            return Response(
                {"error": "You do not have permission to update this application."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status", "").strip()
        valid_statuses = {"pending", "reviewed", "accepted", "rejected"}

        if new_status not in valid_statuses:
            return Response(
                {"error": "Invalid status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application.status = new_status
        application.save()

        Notification.objects.create(
            user=application.applicant,
            type="status_update",
            title="Application status updated",
            message=f"Your application for {application.job.title} is now {new_status}.",
            target_id=application.id,
        )

        serializer = ApplicationSerializer(application)
        return Response(serializer.data)


class UpdateApplicationNotesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, application_id):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can update employer notes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = (
                Application.objects
                .select_related("job__company", "applicant")
                .get(id=application_id)
            )
        except Application.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            getattr(application.job.company, "owner_id", None) != request.user.id
            and getattr(request.user, "role", None) != "admin"
        ):
            return Response(
                {"error": "You do not have permission to update employer notes for this application."},
                status=status.HTTP_403_FORBIDDEN,
            )

        employer_notes = request.data.get("employer_notes", "")
        if employer_notes is None:
            employer_notes = ""
        employer_notes = str(employer_notes)

        application.employer_notes = employer_notes
        application.save(update_fields=["employer_notes"])

        serializer = ApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmployerAcceptedCandidatesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Not authorized."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from companies.models import Company

        if request.user.role == "admin":
            applications = Application.objects.filter(status="accepted")
        else:
            company = Company.objects.filter(owner=request.user).first()

            if not company:
                return Response(
                    {"error": "No company found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            applications = Application.objects.filter(
                job__company=company,
                status="accepted",
            )

        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class SeekerDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can access seeker dashboard stats."},
                status=status.HTTP_403_FORBIDDEN,
            )

        applications = Application.objects.filter(applicant=request.user)

        total_applications = applications.count()
        pending_applications = applications.filter(status="pending").count()
        reviewed_applications = applications.filter(status="reviewed").count()
        accepted_applications = applications.filter(status="accepted").count()
        rejected_applications = applications.filter(status="rejected").count()
        unread_notifications = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()

        return Response(
            {
                "total_applications": total_applications,
                "pending_applications": pending_applications,
                "reviewed_applications": reviewed_applications,
                "accepted_applications": accepted_applications,
                "rejected_applications": rejected_applications,
                "unread_notifications": unread_notifications,
            }
        )