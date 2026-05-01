import re
from decimal import Decimal, InvalidOperation

from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from banking.models import Account, Transaction


class TransferView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        transfer_type = data.get("transferType", "internal")

        try:
            amount = Decimal(str(data.get("amount", "0")))
        except (InvalidOperation, TypeError, ValueError):
            return self._error("Invalid amount.")

        if amount <= 0:
            return self._error("Amount must be greater than zero.")

        reference = (data.get("reference") or "").strip()
        if not reference:
            return self._error("Reference is required.")

        location_payload = self._get_location_payload(data)

        from_account = Account.objects.filter(
            display_key=data.get("fromAccountKey", ""),
            user=request.user,
        ).first()

        if not from_account:
            return self._error("Source account not found.")

        if amount > from_account.current_balance:
            return self._error("Insufficient funds.")

        if transfer_type == "internal":
            return self._internal(
                from_account,
                data,
                amount,
                reference,
                location_payload,
            )

        if transfer_type == "external":
            return self._external(
                from_account,
                data,
                amount,
                reference,
                location_payload,
            )

        return self._error("Invalid transfer type.")

    def _internal(self, from_account, data, amount, reference, location_payload):
        to_account = Account.objects.filter(
            display_key=data.get("toAccountKey", ""),
            user=from_account.user,
        ).first()

        if not to_account:
            return self._error("Destination account not found.")

        if from_account.pk == to_account.pk:
            return self._error("Cannot transfer to the same account.")

        try:
            with db_transaction.atomic():
                Account.objects.filter(pk=from_account.pk).update(
                    current_balance=from_account.current_balance - amount,
                )

                Account.objects.filter(pk=to_account.pk).update(
                    current_balance=to_account.current_balance + amount,
                )

                now = timezone.now()

                Transaction.objects.create(
                    transaction_type="bank_transfer",
                    status="completed",
                    direction="outgoing",
                    amount=amount,
                    timestamp=now,
                    from_account=from_account,
                    to_account=to_account,
                    payer_name=from_account.name,
                    payee_name=to_account.name,
                    payment_reference=reference,
                    description=f"Transfer to {to_account.name}",
                    balance_after=from_account.current_balance - amount,
                    **location_payload,
                )

                Transaction.objects.create(
                    transaction_type="bank_transfer",
                    status="completed",
                    direction="incoming",
                    amount=amount,
                    timestamp=now,
                    from_account=from_account,
                    to_account=to_account,
                    payer_name=from_account.name,
                    payee_name=to_account.name,
                    payment_reference=reference,
                    description=f"Transfer from {from_account.name}",
                    balance_after=to_account.current_balance + amount,
                    **location_payload,
                )

        except Exception as exc:
            return self._error(f"Transfer failed: {exc}")

        return Response(
            {"message": "Transfer completed successfully."},
            status=status.HTTP_201_CREATED,
        )

    def _external(self, from_account, data, amount, reference, location_payload):
        recipient_name = (data.get("recipientName") or "").strip()
        sort_code = (data.get("sortCode") or "").strip()
        account_number = (data.get("accountNumber") or "").strip()

        if not recipient_name:
            return self._error("Recipient name is required.")

        if not re.fullmatch(r"\d{2}-\d{2}-\d{2}", sort_code):
            return self._error("Sort code must be in the format 12-34-56.")

        if not re.fullmatch(r"\d{8}", account_number):
            return self._error("Account number must be exactly 8 digits.")

        to_account = Account.objects.filter(
            account_number=account_number,
            status="active",
        ).first()

        if not to_account:
            return self._error("Destination account not found.")

        if from_account.pk == to_account.pk:
            return self._error("Cannot transfer to the same account.")

        try:
            with db_transaction.atomic():
                Account.objects.filter(pk=from_account.pk).update(
                    current_balance=from_account.current_balance - amount,
                )

                Account.objects.filter(pk=to_account.pk).update(
                    current_balance=to_account.current_balance + amount,
                )

                now = timezone.now()

                Transaction.objects.create(
                    transaction_type="bank_transfer",
                    status="completed",
                    direction="outgoing",
                    amount=amount,
                    timestamp=now,
                    from_account=from_account,
                    to_account=to_account,
                    payer_name=from_account.name,
                    payee_name=recipient_name,
                    payment_reference=reference,
                    sort_code_masked="**-**-" + sort_code[-2:],
                    account_number_masked="****" + account_number[-4:],
                    description=f"Bank transfer to {recipient_name}",
                    balance_after=from_account.current_balance - amount,
                    **location_payload,
                )

                Transaction.objects.create(
                    transaction_type="bank_transfer",
                    status="completed",
                    direction="incoming",
                    amount=amount,
                    timestamp=now,
                    from_account=to_account,
                    to_account=from_account,
                    payer_name=recipient_name,
                    payee_name=from_account.name,
                    payment_reference=reference,
                    sort_code_masked="**-**-" + sort_code[-2:],
                    account_number_masked="****" + account_number[-4:],
                    description=f"Bank transfer from {recipient_name}",
                    balance_after=to_account.current_balance + amount,
                    **location_payload,
                )

        except Exception as exc:
            return self._error(f"Transfer failed: {exc}")

        return Response(
            {"message": "Bank transfer submitted successfully."},
            status=status.HTTP_201_CREATED,
        )

    def _get_location_payload(self, data):
        location = data.get("location") or {}

        latitude = location.get("latitude")
        longitude = location.get("longitude")
        city = (location.get("city") or "").strip()
        country = (location.get("country") or "").strip()
        location_label = (location.get("locationLabel") or "").strip()

        return {
            "latitude": latitude or None,
            "longitude": longitude or None,
            "city": city,
            "country": country[:2].upper() if country else "",
            "location_label": location_label,
        }

    def _error(self, message, http_status=status.HTTP_400_BAD_REQUEST):
        return Response({"error": message}, status=http_status)