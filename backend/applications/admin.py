from django.contrib import admin

from .models import Application


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("job", "seeker", "status", "applied_at")
    list_filter = ("status", "applied_at")
    search_fields = ("job__title", "seeker__username", "seeker__email")