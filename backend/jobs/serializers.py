from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    company_logo = serializers.ImageField(source="company.logo", read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "company",
            "company_name",
            "company_logo",
            "title",
            "description",
            "location",
            "job_type",
            "salary_min",
            "salary_max",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "company_name",
            "company_logo",
            "created_at",
        ]