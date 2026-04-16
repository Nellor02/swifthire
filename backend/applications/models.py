from django.conf import settings
from django.db import models
from jobs.models import Job


class Application(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("reviewed", "Reviewed"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    cover_letter = models.TextField(blank=True)
    cv = models.FileField(upload_to="applications/cvs/", blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )
    employer_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("job", "applicant")

    def __str__(self):
        return f"{self.applicant.username} -> {self.job.title}"