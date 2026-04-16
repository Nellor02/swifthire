from django.contrib import admin
from .models import EmployerApplication


@admin.register(EmployerApplication)
class EmployerApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "company_name",
        "user",
        "company_email",
        "status",
        "submitted_at",
        "reviewed_at",
    )
    list_filter = ("status", "submitted_at", "reviewed_at")
    search_fields = (
        "company_name",
        "company_email",
        "company_registration_number",
        "contact_person_name",
        "user__username",
        "user__email",
    )