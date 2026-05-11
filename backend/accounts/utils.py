from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

from profiles.models import Notification

User = get_user_model()


def get_swifthire_email_address(email_type="support"):
    support_email = getattr(
        settings,
        "SWIFTHIRE_SUPPORT_EMAIL",
        "support@useswifthire.com",
    )
    hello_email = getattr(
        settings,
        "SWIFTHIRE_HELLO_EMAIL",
        "hello@useswifthire.com",
    )
    contact_email = getattr(
        settings,
        "SWIFTHIRE_CONTACT_EMAIL",
        "contact@useswifthire.com",
    )

    if email_type in ["welcome", "onboarding", "hello"]:
        return hello_email

    if email_type in ["contact", "contact_form", "direct_contact"]:
        return contact_email

    return support_email


def get_swifthire_from_email(email_type="support"):
    support_email = getattr(
        settings,
        "SWIFTHIRE_SUPPORT_EMAIL",
        "support@useswifthire.com",
    )

    return f"SwiftHire Support <{support_email}>"


def send_platform_email(
    subject,
    message,
    recipient_list,
    email_type="support",
    fail_silently=True,
):
    if not recipient_list:
        return False

    try:
        send_mail(
            subject=subject,
            message=f"{message}\n\n— SwiftHire",
            from_email=get_swifthire_from_email(email_type),
            recipient_list=recipient_list,
            fail_silently=fail_silently,
        )
        return True
    except Exception:
        return False


def create_notification(
    user,
    notification_type,
    title,
    message,
    target_id=None,
    target_url="",
    email_type="support",
    send_email=True,
):
    try:
        Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            target_id=target_id,
            target_url=target_url or "",
        )
    except Exception:
        pass

    if send_email:
        recipient_email = getattr(user, "email", "").strip()

        if recipient_email:
            site_url = getattr(settings, "FRONTEND_URL", "").rstrip("/")
            full_action_url = (
                f"{site_url}{target_url}"
                if site_url and target_url.startswith("/")
                else target_url
            )

            email_message = message

            if full_action_url:
                email_message += f"\n\nOpen here:\n{full_action_url}"

            send_platform_email(
                subject=title,
                message=email_message,
                recipient_list=[recipient_email],
                email_type=email_type,
            )


def notify_admins_new_employer_application(application):
    admins = User.objects.filter(role="admin")

    for admin in admins:
        create_notification(
            user=admin,
            notification_type="application",
            title="New Employer Application",
            message=(
                f"A new employer application was submitted by "
                f"{application.user.username} for {application.company_name}."
            ),
            target_id=application.id,
            target_url=f"/admin/employer-applications/{application.id}",
            email_type="support",
        )


def notify_employer_application_review(application):
    if application.status == "approved":
        title = "Employer Application Approved"
        message = (
            f"Your employer application for {application.company_name} has been approved. "
            f"You can now log in and use your employer dashboard."
        )
        target_url = "/employer/jobs"
    elif application.status == "rejected":
        title = "Employer Application Rejected"
        message = (
            f"Your employer application for {application.company_name} was rejected."
        )

        if application.admin_notes:
            message += f"\n\nAdmin notes: {application.admin_notes}"

        target_url = "/employer/application-status"
    else:
        return

    create_notification(
        user=application.user,
        notification_type="status_update",
        title=title,
        message=message,
        target_id=application.id,
        target_url=target_url,
        email_type="support",
    )