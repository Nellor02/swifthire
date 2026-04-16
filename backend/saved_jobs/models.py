from django.conf import settings
from django.db import models
from jobs.models import Job


class SavedJob(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_jobs",
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="saved_by_users",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "job")

    def __str__(self):
        return f"{self.user.username} saved {self.job.title}"