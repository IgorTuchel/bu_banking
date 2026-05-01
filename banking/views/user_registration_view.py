from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.utils.text import slugify
from django.contrib.auth.password_validation import validate_password

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Account, UserProfile


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response(
            {
                "message": "Registration endpoint is working. Send a POST request to register.",
                "required_fields": [
                    "username",
                    "password",
                    "confirmPassword",
                    "email",
                    "firstName",
                    "lastName",
                    "dateOfBirth",
                    "phoneMobile",
                    "houseNumber",
                    "streetAddress",
                    "townCity",
                    "postcode",
                ],
                "optional_fields": [
                    "phoneHome",
                    "flatNumber",
                    "county",
                ],
            }
        )

    def _make_display_key(self, username, account_type):
        base = slugify(f"{username}-{account_type}") or account_type
        key = base
        counter = 1

        while Account.objects.filter(display_key=key).exists():
            counter += 1
            key = f"{base}-{counter}"

        return key

    def post(self, request, *args, **kwargs):
        data = request.data

        username = (data.get("username") or "").strip()
        password = data.get("password") or ""
        confirm_password = data.get("confirmPassword") or ""

        email = (data.get("email") or "").strip()
        first_name = (data.get("firstName") or "").strip()
        last_name = (data.get("lastName") or "").strip()
        date_of_birth = data.get("dateOfBirth") or None

        phone_home = (data.get("phoneHome") or "").strip()
        phone_mobile = (data.get("phoneMobile") or "").strip()

        house_number = (data.get("houseNumber") or "").strip()
        flat_number = (data.get("flatNumber") or "").strip()
        street_address = (data.get("streetAddress") or "").strip()
        town_city = (data.get("townCity") or "").strip()
        county = (data.get("county") or "").strip()
        postcode = (data.get("postcode") or "").strip()

        required_checks = {
            "username": username,
            "password": password,
            "confirmPassword": confirm_password,
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
            "dateOfBirth": date_of_birth,
            "phoneMobile": phone_mobile,
            "houseNumber": house_number,
            "streetAddress": street_address,
            "townCity": town_city,
            "postcode": postcode,
        }

        missing_fields = [
            field for field, value in required_checks.items() if not value
        ]

        if missing_fields:
            return Response(
                {
                    "error": "Please complete all required fields.",
                    "fields": missing_fields,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != confirm_password:
            return Response(
                {"error": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email address is already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_email(email)
            validate_password(password)
        except ValidationError as exc:
            return Response(
                {"error": " ".join(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                )

                UserProfile.objects.create(
                    user=user,
                    account_status="Active",
                    security_level="High",
                    member_since=str(user.date_joined.year),
                    date_of_birth=date_of_birth,
                    phone_home=phone_home,
                    phone_mobile=phone_mobile,
                    house_number=house_number,
                    flat_number=flat_number,
                    street_address=street_address,
                    town_city=town_city,
                    county=county,
                    postcode=postcode,
                )

                current_account = Account.objects.create(
                    name=f"{first_name}'s Current Account",
                    display_key=self._make_display_key(username, "current"),
                    account_type="current",
                    currency="GBP",
                    status="active",
                    starting_balance=Decimal("1000.00"),
                    current_balance=Decimal("1000.00"),
                    round_up_enabled=False,
                    user=user,
                )

                savings_account = Account.objects.create(
                    name=f"{first_name}'s Savings Account",
                    display_key=self._make_display_key(username, "savings"),
                    account_type="savings",
                    currency="GBP",
                    status="active",
                    starting_balance=Decimal("0.00"),
                    current_balance=Decimal("0.00"),
                    round_up_enabled=True,
                    user=user,
                )

            return Response(
                {
                    "message": "User registered successfully.",
                    "user_id": user.id,
                    "accounts": [
                        {
                            "id": str(current_account.id),
                            "name": current_account.name,
                            "type": current_account.get_account_type_display(),
                            "balance": str(current_account.current_balance),
                        },
                        {
                            "id": str(savings_account.id),
                            "name": savings_account.name,
                            "type": savings_account.get_account_type_display(),
                            "balance": str(savings_account.current_balance),
                        },
                    ],
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as exc:
            return Response(
                {"error": f"Error creating user: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )