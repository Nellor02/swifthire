# Generated manually to safely make email_verification_token unique.

import uuid
from django.db import migrations, models


def regenerate_unique_email_verification_tokens(apps, schema_editor):
    User = apps.get_model("accounts", "User")

    for user in User.objects.all():
        user.email_verification_token = uuid.uuid4()
        user.save(update_fields=["email_verification_token"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_user_email_verification_token_user_email_verified_and_more"),
    ]

    operations = [
        migrations.RunPython(
            regenerate_unique_email_verification_tokens,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="user",
            name="email_verification_token",
            field=models.UUIDField(
                default=uuid.uuid4,
                editable=False,
                unique=True,
            ),
        ),
    ]