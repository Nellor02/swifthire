from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from jobs.models import Job
from .models import SavedJob
from .serializers import SavedJobSerializer


class SavedJobsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can view saved jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        saved_jobs = SavedJob.objects.filter(user=request.user).select_related("job", "job__company")
        serializer = SavedJobSerializer(saved_jobs, many=True)
        return Response(serializer.data)


class ToggleSavedJobAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, job_id):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can save jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            job = Job.objects.get(id=job_id, status="active")
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_job, created = SavedJob.objects.get_or_create(
            user=request.user,
            job=job,
        )

        if not created:
            return Response(
                {"error": "Job is already saved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SavedJobSerializer(saved_job)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, job_id):
        if getattr(request.user, "role", None) != "seeker":
            return Response(
                {"error": "Only seekers can remove saved jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            saved_job = SavedJob.objects.get(user=request.user, job_id=job_id)
        except SavedJob.DoesNotExist:
            return Response(
                {"error": "Saved job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved_job.delete()
        return Response({"message": "Saved job removed."}, status=status.HTTP_200_OK)