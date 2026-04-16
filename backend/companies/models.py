from django.conf import settings
from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="company",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name