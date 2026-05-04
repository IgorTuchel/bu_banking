from decimal import Decimal

import requests

from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from banking.models import Card, Transaction


class PaymentNetworkCardsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not settings.PAYMENT_NETWORK_API_KEY:
            return Response(
                {"error": "Payment network API key is not configured."},
                status=500,
            )

        response = requests.get(
            f"{settings.PAYMENT_NETWORK_BASE_URL}/api/cards/me",
            headers={"X-API-Key": settings.PAYMENT_NETWORK_API_KEY},
            timeout=10,
        )

        if not response.ok:
            return Response(
                {
                    "error": "Failed to fetch payment network cards.",
                    "status_code": response.status_code,
                    "details": response.text,
                },
                status=response.status_code,
            )

        return Response(response.json())


class PaymentNetworkChargeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        card_number = str(request.data.get("card_number") or "").strip()
        amount = Decimal(str(request.data.get("amount") or "0"))
        merchant_id = str(request.data.get("merchant_id") or "ExpoDemo").strip()
        description = str(
            request.data.get("description") or f"{merchant_id} card payment"
        ).strip()
        city = str(request.data.get("city") or "Bournemouth").strip()
        country = str(request.data.get("country") or "GB").strip()
        location_label = str(
            request.data.get("location_label") or "JP Morgan Bournemouth"
        ).strip()

        latitude = request.data.get("latitude", "50.74355")
        longitude = request.data.get("longitude", "-1.83187")

        if not card_number:
            return Response({"error": "card_number is required."}, status=400)

        if amount <= 0:
            return Response({"error": "amount must be greater than 0."}, status=400)

        try:
            card = Card.objects.select_related("account", "account__user").get(
                network_card_number=card_number
            )
        except Card.DoesNotExist:
            return Response(
                {"error": "No local card found for this network card number."},
                status=404,
            )

        if card.account.user != request.user and not request.user.is_staff:
            return Response(
                {"error": "You do not have permission to charge this card."},
                status=403,
            )
        
        if card.frozen or card.status != "active":
            transaction = Transaction.objects.create(
                transaction_type="card_payment",
                status="declined",
                direction="outgoing",
                amount=amount,
                timestamp=timezone.now(),
                from_account=card.account,
                card=card,
                description=description,
                payment_reference="LOCAL-FROZEN-CARD",
                terminal_id="",
                city=city,
                country=country,
                latitude=Decimal(str(latitude)) if latitude not in [None, ""] else None,
                longitude=Decimal(str(longitude)) if longitude not in [None, ""] else None,
                location_label=location_label,
                balance_after=None,
            )

            return Response(
                {
                    "transaction_id": transaction.id,
                    "status": "declined",
                    "response_code": "57",
                    "message": "Card is frozen or inactive.",
                    "transaction": {
                        "id": transaction.id,
                        "amount": str(transaction.amount),
                        "status": transaction.status,
                        "description": transaction.description,
                    },
                },
                status=200,
            )

        network_response = requests.post(
            f"{settings.PAYMENT_NETWORK_BASE_URL}/api/authorize",
            headers={
                "Content-Type": "application/json",
                "X-API-Key": settings.PAYMENT_NETWORK_API_KEY,
            },
            json={
                "amount": float(amount),
                "currency": "GBP",
                "card_number": card_number,
                "merchant_id": merchant_id,
                "issuing_bank_id": "a07daf9f-2c54-42bf-bed3-870e9d5428e1",
            },
            timeout=10,
        )

        network_data = network_response.json()

        status_value = (
            "completed"
            if network_data.get("response_code") == "00"
            and network_data.get("status") == "authorized"
            else "declined"
        )

        balance_after = None

        card_lookup = requests.get(
            f"{settings.PAYMENT_NETWORK_BASE_URL}/api/cards/a07daf9f-2c54-42bf-bed3-870e9d5428e1/{card_number}",
            timeout=10,
        )

        if card_lookup.ok:
            card_lookup_data = card_lookup.json()
            if card_lookup_data.get("balance") is not None:
                balance_after = Decimal(str(card_lookup_data["balance"]))

        transaction = Transaction.objects.create(
            transaction_type="card_payment",
            status=status_value,
            direction="outgoing",
            amount=amount,
            timestamp=timezone.now(),
            from_account=card.account,
            card=card,
            description=description,
            payment_reference=network_data.get("transaction_id", ""),
            terminal_id=network_data.get("authorization_code", ""),
            city=city,
            country=country,
            latitude=Decimal(str(latitude)) if latitude not in [None, ""] else None,
            longitude=Decimal(str(longitude)) if longitude not in [None, ""] else None,
            location_label=location_label,
            balance_after=balance_after,
        )

        return Response(
            {
                "network": network_data,
                "transaction": {
                    "id": transaction.id,
                    "amount": str(transaction.amount),
                    "status": transaction.status,
                    "description": transaction.description,
                    "payment_reference": transaction.payment_reference,
                    "balance_after": str(transaction.balance_after)
                    if transaction.balance_after is not None
                    else None,
                },
            },
            status=201 if status_value == "completed" else 200,
        )