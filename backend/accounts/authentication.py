from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class SwiftHireTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["username"] = user.username
        token["role"] = getattr(user, "role", "")
        token["email_verified"] = getattr(user, "email_verified", False)

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user

        if not getattr(user, "email_verified", False):
            raise serializers.ValidationError(
                {
                    "detail": (
                        "Please verify your email address before logging in."
                    )
                }
            )

        data["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": getattr(user, "role", ""),
            "email_verified": getattr(user, "email_verified", False),
        }

        return data