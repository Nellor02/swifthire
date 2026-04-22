from django.core.paginator import Paginator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Job
from .serializers import JobSerializer
from applications.models import Application
from profiles.models import ShortlistedCandidate
from companies.models import Company
from accounts.models import EmployerApplication


class JobListCreateAPIView(APIView):
    def get(self, request):
        queryset = (
            Job.objects.filter(status="active")
            .select_related("company")
            .order_by("-created_at")
        )

        search = request.query_params.get("search", "").strip()
        location = request.query_params.get("location", "").strip()
        job_type = request.query_params.get("job_type", "").strip()

        if search:
            queryset = queryset.filter(title__icontains=search)

        if location:
            queryset = queryset.filter(location__icontains=location)

        if job_type:
            queryset = queryset.filter(job_type=job_type)

        page = request.query_params.get("page")
        page_size = request.query_params.get("page_size")

        if page and page_size:
            try:
                page = int(page)
                page_size = int(page_size)
            except ValueError:
                return Response(
                    {"error": "Invalid pagination values."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)

            serializer = JobSerializer(page_obj.object_list, many=True)
            return Response(
                {
                    "count": paginator.count,
                    "total_pages": paginator.num_pages,
                    "current_page": page_obj.number,
                    "next": page_obj.next_page_number() if page_obj.has_next() else None,
                    "previous": page_obj.previous_page_number()
                    if page_obj.has_previous()
                    else None,
                    "results": serializer.data,
                }
            )

        serializer = JobSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if getattr(request.user, "role", None) != "employer":
            return Response(
                {"error": "Only employers can create jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            employer_application = EmployerApplication.objects.get(user=request.user)
            if employer_application.status != "approved":
                return Response(
                    {"error": "Your employer account is pending approval."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except EmployerApplication.DoesNotExist:
            pass

        company = Company.objects.filter(owner=request.user).first()

        if not company:
            return Response(
                {"error": "No company profile is linked to this employer account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(company=company)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobDetailAPIView(APIView):
    def get_object(self, pk):
        try:
            return Job.objects.select_related("company").get(pk=pk)
        except Job.DoesNotExist:
            return None

    def get(self, request, pk):
        job = self.get_object(pk)
        if not job:
            return Response(
                {"error": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = JobSerializer(job)
        return Response(serializer.data)

    def patch(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        job = self.get_object(pk)
        if not job:
            return Response(
                {"error": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can edit jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(request.user, "role", None) == "employer":
            try:
                employer_application = EmployerApplication.objects.get(user=request.user)
                if employer_application.status != "approved":
                    return Response(
                        {"error": "Your employer account is pending approval."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except EmployerApplication.DoesNotExist:
                pass

        if getattr(request.user, "role", None) != "admin":
            company = Company.objects.filter(owner=request.user).first()
            if not company or job.company_id != company.id:
                return Response(
                    {"error": "You do not have permission to edit this job."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = JobSerializer(job, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        job = self.get_object(pk)
        if not job:
            return Response(
                {"error": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can delete jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(request.user, "role", None) == "employer":
            try:
                employer_application = EmployerApplication.objects.get(user=request.user)
                if employer_application.status != "approved":
                    return Response(
                        {"error": "Your employer account is pending approval."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except EmployerApplication.DoesNotExist:
                pass

        if getattr(request.user, "role", None) != "admin":
            company = Company.objects.filter(owner=request.user).first()
            if not company or job.company_id != company.id:
                return Response(
                    {"error": "You do not have permission to delete this job."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        job.delete()
        return Response(
            {"message": "Job deleted successfully."},
            status=status.HTTP_200_OK,
        )


class EmployerJobListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can access employer jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(request.user, "role", None) == "employer":
            try:
                employer_application = EmployerApplication.objects.get(user=request.user)
                if employer_application.status != "approved":
                    return Response(
                        {"error": "Your employer account is pending approval."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except EmployerApplication.DoesNotExist:
                pass

        if getattr(request.user, "role", None) == "admin":
            queryset = Job.objects.select_related("company").order_by("-created_at")
        else:
            company = Company.objects.filter(owner=request.user).first()
            if not company:
                return Response(
                    {"error": "No company profile is linked to this employer account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            queryset = (
                Job.objects.filter(company=company)
                .select_related("company")
                .order_by("-created_at")
            )

        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 5))

        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = JobSerializer(page_obj.object_list, many=True)

        return Response(
            {
                "count": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page_obj.number,
                "next": page_obj.next_page_number() if page_obj.has_next() else None,
                "previous": page_obj.previous_page_number()
                if page_obj.has_previous()
                else None,
                "results": serializer.data,
            }
        )


class EmployerDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can access dashboard stats."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(request.user, "role", None) == "employer":
            try:
                employer_application = EmployerApplication.objects.get(user=request.user)
                if employer_application.status != "approved":
                    return Response(
                        {"error": "Your employer account is pending approval."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except EmployerApplication.DoesNotExist:
                pass

        if getattr(request.user, "role", None) == "admin":
            total_jobs = Job.objects.count()
            total_applications = Application.objects.count()
        else:
            company = Company.objects.filter(owner=request.user).first()
            if not company:
                return Response(
                    {"error": "No company profile is linked to this employer account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            total_jobs = Job.objects.filter(company=company).count()
            total_applications = Application.objects.filter(job__company=company).count()

        total_shortlisted = ShortlistedCandidate.objects.filter(
            employer=request.user
        ).count()

        return Response(
            {
                "total_jobs": total_jobs,
                "total_applications": total_applications,
                "total_shortlisted": total_shortlisted,
            }
        )