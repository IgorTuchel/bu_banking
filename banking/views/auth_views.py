from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import Account, UserLoginLocation
from ..serializers import AccountSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        location = request.data.get("location") or {}

        if not username or not password:
            return Response(
                {"error": "Please provide both username and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        self._save_login_location(user, location)

        refresh = RefreshToken.for_user(user)

        accounts = Account.objects.filter(user=user)
        account_data = AccountSerializer(accounts, many=True).data

        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_staff": user.is_staff,
                    "last_login": user.last_login,
                },
                "accounts": account_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )

    def _save_login_location(self, user, location):
        latitude = location.get("latitude")
        longitude = location.get("longitude")
        location_label = (location.get("locationLabel") or "").strip()

        if latitude in [None, ""] or longitude in [None, ""]:
            return

        UserLoginLocation.objects.update_or_create(
            user=user,
            defaults={
                "latitude": latitude,
                "longitude": longitude,
                "location_label": location_label or "Current device location",
            },
        )


class UserAccountsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        accounts = Account.objects.filter(user=user)

        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_staff": user.is_staff,
                    "last_login": user.last_login,
                },
                "accounts": AccountSerializer(accounts, many=True).data,
            }
        )