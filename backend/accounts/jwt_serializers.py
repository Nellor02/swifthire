from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": "Invalid username or password.",
        "email_not_verified": "Please verify your email before logging in.",
    }

    def validate(self, attrs):
        username = attrs.get("username", "")

        try:
            user = User.objects.get(username=username)

            if not getattr(user, "email_verified", False):
                raise serializers.ValidationError(
                    {"detail": self.error_messages["email_not_verified"]}
                )
        except User.DoesNotExist:
            pass

        data = super().validate(attrs)

        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": getattr(self.user, "role", ""),
            "email_verified": getattr(self.user, "email_verified", False),
        }

        return data