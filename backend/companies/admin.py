from django.contrib import admin

from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "employer", "location", "verified", "created_at")
    list_filter = ("verified", "location")
    search_fields = ("name", "employer__username", "employer__email")