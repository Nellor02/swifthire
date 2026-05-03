from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    jobs_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id",
            "owner",
            "owner_username",
            "name",
            "email",
            "phone",
            "website",
            "address",
            "description",
            "logo",
            "jobs_count",
        ]
        read_only_fields = [
            "id",
            "owner",
            "owner_username",
            "jobs_count",
        ]

    def get_jobs_count(self, obj):
        return obj.jobs.count()