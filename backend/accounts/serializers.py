from rest_framework import serializers
from .models import User, EmployerApplication


class SeekerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role="seeker",
        )


class EmployerApplicationRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    company_name = serializers.CharField(max_length=255)
    company_email = serializers.EmailField()
    company_phone = serializers.CharField(max_length=50)
    company_website = serializers.URLField(required=False, allow_blank=True)
    company_registration_number = serializers.CharField(
        max_length=120, required=False, allow_blank=True
    )
    company_address = serializers.CharField()
    business_description = serializers.CharField()
    contact_person_name = serializers.CharField(max_length=255)
    contact_person_position = serializers.CharField(
        max_length=255, required=False, allow_blank=True
    )
    supporting_note = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role="employer",
            is_active=True,
        )

        EmployerApplication.objects.create(
            user=user,
            company_name=validated_data["company_name"],
            company_email=validated_data["company_email"],
            company_phone=validated_data["company_phone"],
            company_website=validated_data.get("company_website", ""),
            company_registration_number=validated_data.get(
                "company_registration_number", ""
            ),
            company_address=validated_data["company_address"],
            business_description=validated_data["business_description"],
            contact_person_name=validated_data["contact_person_name"],
            contact_person_position=validated_data.get("contact_person_position", ""),
            supporting_note=validated_data.get("supporting_note", ""),
            status="pending",
        )

        return user


class EmployerApplicationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = EmployerApplication
        fields = [
            "id",
            "user",
            "username",
            "email",
            "company_name",
            "company_email",
            "company_phone",
            "company_website",
            "company_registration_number",
            "company_address",
            "business_description",
            "contact_person_name",
            "contact_person_position",
            "supporting_note",
            "status",
            "admin_notes",
            "submitted_at",
            "reviewed_at",
        ]
        read_only_fields = fields