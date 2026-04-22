from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "email", "phone")
    search_fields = ("name", "owner__username", "email", "phone", "website")