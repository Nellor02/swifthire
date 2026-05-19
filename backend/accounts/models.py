import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ("seeker", "Seeker"),
        ("employer", "Employer"),
        ("admin", "Admin"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="seeker")

    email_verified = models.BooleanField(default=False)

    email_verification_token = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        null=True,
        blank=True,
    )

    email_verified_at = models.DateTimeField(null=True, blank=True)

    password_reset_token = models.UUIDField(
        null=True,
        blank=True,
        unique=True,
    )

    password_reset_sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def mark_email_verified(self):
        self.email_verified = True
        self.email_verified_at = timezone.now()
        self.email_verification_token = None

        self.save(
            update_fields=[
                "email_verified",
                "email_verified_at",
                "email_verification_token",
            ]
        )

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

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    admin_notes = models.TextField(blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    pending_reminder_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.company_name} ({self.status})"