from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ("seeker", "Seeker"),
        ("employer", "Employer"),
        ("admin", "Admin"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="seeker")

    def __str__(self):
        return self.username


class EmployerApplication(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="employer_application",
    )
    company_name = models.CharField(max_length=255)
    company_email = models.EmailField()
    company_phone = models.CharField(max_length=50)
    company_website = models.URLField(blank=True)
    company_registration_number = models.CharField(max_length=120, blank=True)
    company_address = models.TextField()
    business_description = models.TextField()
    contact_person_name = models.CharField(max_length=255)
    contact_person_position = models.CharField(max_length=255, blank=True)
    supporting_note = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.company_name} ({self.status})"