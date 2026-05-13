from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView
from accounts.authentication import SwiftHireTokenObtainPairSerializer
class SwiftHireTokenObtainPairView(TokenObtainPairView):
    serializer_class = SwiftHireTokenObtainPairSerializer
def home(request):
    return HttpResponse("MAIN URLS FILE IS WORKING")


urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),
    path("api/jobs/", include("jobs.urls")),
    path("api/applications/", include("applications.urls")),
    path("api/profiles/", include("profiles.urls")),
    path("api/saved-jobs/", include("saved_jobs.urls")),
    path("api/companies/", include("companies.urls")),

    path(
    "api/token/",
    SwiftHireTokenObtainPairView.as_view(),
    name="token_obtain_pair",
    ),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/health/", include("core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)