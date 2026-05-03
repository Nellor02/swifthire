from rest_framework import serializers
from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    applicant_username = serializers.CharField(source="applicant.username", read_only=True)
    applicant_email = serializers.EmailField(source="applicant.email", read_only=True)
    applicant_profile_id = serializers.IntegerField(source="applicant.seeker_profile.id", read_only=True)
    applicant_profile_picture = serializers.ImageField(
        source="applicant.seeker_profile.profile_picture",
        read_only=True,
    )
    job_title = serializers.CharField(source="job.title", read_only=True)
    company_name = serializers.CharField(source="job.company.name", read_only=True)
    company_logo = serializers.ImageField(source="job.company.logo", read_only=True)

    class Meta:
        model = Application
        fields = [
            "id",
            "job",
            "job_title",
            "company_name",
            "company_logo",
            "applicant",
            "applicant_username",
            "applicant_email",
            "applicant_profile_id",
            "applicant_profile_picture",
            "cover_letter",
            "cv",
            "status",
            "employer_notes",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "job",
            "job_title",
            "company_name",
            "company_logo",
            "applicant",
            "applicant_username",
            "applicant_email",
            "applicant_profile_id",
            "applicant_profile_picture",
            "cv",
            "created_at",
        ]