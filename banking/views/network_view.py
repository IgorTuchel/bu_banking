from decimal import Decimal, InvalidOperation

from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from banking.models import Account, Card, Transaction
from banking.services.payment_network import (
    get_my_bank,
    initiate_transfer,
    list_banks,
)


class NetworkBanksView(APIView):
    """GET /api/network/banks/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            banks = list_banks()
            return Response(banks)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


class NetworkStatusView(APIView):
    """GET /api/network/status/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            data = get_my_bank()
            return Response(data)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


class NetworkTransferView(APIView):
    """POST /api/network/transfer/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        from_account_key = data.get("fromAccountKey")
        card_number = data.get("cardNumber", "").strip()
        acquiring_bank_id = data.get("acquiringBankId", "").strip()
        merchant_id = data.get("merchantId", "Aurix").strip()
        reference = data.get("reference", "").strip()

        try:
            raw_amount = data.get("amount", 0)
            amount = Decimal(str(raw_amount))
            if amount <= 0:
                return Response(
                    {"error": "Amount must be greater than zero."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"error": "Invalid amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the source account belongs to this user
        try:
            account = Account.objects.get(
                display_key=from_account_key,
                user=request.user,
            )
        except Account.DoesNotExist:
            return Response(
                {"error": "Account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if account.current_balance < amount:
            return Response(
                {"error": "Insufficient funds."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not card_number or len(card_number) != 16:
            return Response(
                {"error": "Card number must be 16 digits."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not acquiring_bank_id:
            return Response(
                {"error": "Please select a destination bank."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Submit to payment network
            result = initiate_transfer(
                card_number=card_number,
                amount=amount,
                merchant_id=merchant_id,
                acquiring_bank_id=acquiring_bank_id,
            )

            # Deduct balance and record transaction
            with db_transaction.atomic():
                Account.objects.filter(pk=account.pk).update(
                    current_balance=account.current_balance - amount
                )
                Transaction.objects.create(
                    transaction_type="network_transfer",
                    status="completed",
                    direction="outgoing",
                    amount=amount,
                    timestamp=timezone.now(),
                    from_account=account,
                    description=reference or f"Network transfer to {acquiring_bank_id}",
                    balance_after=account.current_balance - amount,
                )

            return Response({"success": True, "result": result})

        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
