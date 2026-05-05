from django.conf import settings
from django.db import models


class SeekerProfile(models.Model):
    JOB_TYPE_CHOICES = [
        ("full_time", "Full-time"),
        ("part_time", "Part-time"),
        ("contract", "Contract"),
        ("internship", "Internship"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seeker_profile",
    )
    full_name = models.CharField(max_length=255)
    headline = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated skills")
    experience_years = models.PositiveIntegerField(default=0)
    education = models.TextField(blank=True)
    work_experience = models.TextField(blank=True)
    preferred_job_type = models.CharField(
        max_length=20,
        choices=JOB_TYPE_CHOICES,
        blank=True,
    )
    preferred_location = models.CharField(max_length=255, blank=True)
    linkedin_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profiles/pictures/",
        blank=True,
        null=True,
    )
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"


class ShortlistedCandidate(models.Model):
    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shortlisted_candidates",
    )
    seeker_profile = models.ForeignKey(
        SeekerProfile,
        on_delete=models.CASCADE,
        related_name="shortlisted_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("employer", "seeker_profile")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.employer.username} shortlisted {self.seeker_profile.full_name}"


class Conversation(models.Model):
    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employer_conversations",
    )
    seeker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seeker_conversations",
    )
    candidate_profile = models.ForeignKey(
        SeekerProfile,
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("employer", "seeker")
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.employer.username} ↔ {self.seeker.username}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message from {self.sender.username} in conversation {self.conversation_id}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ("message", "Message"),
        ("application", "Application"),
        ("status_update", "Status Update"),
        ("shortlist", "Shortlist"),
        ("contact", "Contact"),
        ("system", "System"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)

    target_id = models.IntegerField(null=True, blank=True)
    target_url = models.CharField(max_length=500, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.type}"