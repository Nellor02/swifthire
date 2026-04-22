from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Company
from .serializers import CompanySerializer
from accounts.models import EmployerApplication


class CompanyListAPIView(APIView):
    def get(self, request):
        companies = Company.objects.all().order_by("name")
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)


class CompanyDetailAPIView(APIView):
    def get(self, request, pk):
        try:
            company = Company.objects.get(pk=pk)
        except Company.DoesNotExist:
            return Response(
                {"error": "Company not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanySerializer(company)
        return Response(serializer.data)


class MyCompanyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can access company profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(request.user, "role", None) == "employer":
            try:
                employer_application = EmployerApplication.objects.get(user=request.user)
                if employer_application.status != "approved":
                    return Response(
                        {"error": "Your employer account is pending approval."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except EmployerApplication.DoesNotExist:
                pass

        try:
            company = Company.objects.get(owner=request.user)
        except Company.DoesNotExist:
            return Response(
                {"error": "Company profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanySerializer(company)
        return Response(serializer.data)

    def patch(self, request):
        if getattr(request.user, "role", None) not in ["employer", "admin"]:
            return Response(
                {"error": "Only employers and admins can update company profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if getattr(request.user, "role", None) == "employer":
            try:
                employer_application = EmployerApplication.objects.get(user=request.user)
                if employer_application.status != "approved":
                    return Response(
                        {"error": "Your employer account is pending approval."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except EmployerApplication.DoesNotExist:
                pass

        try:
            company = Company.objects.get(owner=request.user)
        except Company.DoesNotExist:
            return Response(
                {"error": "Company profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)