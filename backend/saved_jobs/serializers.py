from rest_framework import serializers
from .models import SavedJob


class SavedJobSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="job.title", read_only=True)
    company_name = serializers.CharField(source="job.company.name", read_only=True)
    location = serializers.CharField(source="job.location", read_only=True)
    job_type = serializers.CharField(source="job.job_type", read_only=True)

    class Meta:
        model = SavedJob
        fields = [
            "id",
            "job",
            "job_title",
            "company_name",
            "location",
            "job_type",
            "created_at",
        ]
        read_only_fields = fields