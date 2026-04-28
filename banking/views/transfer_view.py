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

        # ── Step 1: Validate fields ───────────────────────────────────────────

        try:
            amount = Decimal(str(data.get("amount", "0")))
        except (InvalidOperation, TypeError, ValueError):
            return self._error("Invalid amount.")

        if amount <= 0:
            return self._error("Amount must be greater than zero.")

        reference = (data.get("reference") or "").strip()
        if not reference:
            return self._error("Reference is required.")

        # ── Step 2: Check source account exists and belongs to this user ──────
        print(data)
        from_account = Account.objects.filter(
            display_key=data.get("fromAccountKey", ""),
            user=request.user,
        ).first()
        print(from_account)
        if not from_account:
            return self._error("Source account not found.")

        # ── Step 3: Check balance ─────────────────────────────────────────────

        if amount > from_account.current_balance:
            return self._error("Insufficient funds.")

        # ── Step 4 & 5: Route ─────────────────────────────────────────────────

        if transfer_type == "internal":
            return self._internal(from_account, data, amount, reference)

        if transfer_type == "external":
            return self._external(from_account, data, amount, reference)

        return self._error("Invalid transfer type.")

    # ── Internal (own accounts) ───────────────────────────────────────────────

    def _internal(self, from_account, data, amount, reference):

        # Step 2b: Check destination account exists
        to_account = Account.objects.filter(
            display_key=data.get("toAccountKey", ""),
            user=from_account.user,
        ).first()

        if not to_account:
            return self._error("Destination account not found.")

        print(
            from_account, to_account, from_account.pk, to_account.pk, "XDDDDDDDDDDDDD"
        )
        if from_account.pk == to_account.pk:
            return self._error("Cannot transfer to the same account.")

        # Step 3b: Already checked balance above — proceed

        try:
            with db_transaction.atomic():
                # Step 4: Deduct from sender
                Account.objects.filter(pk=from_account.pk).update(
                    current_balance=from_account.current_balance - amount
                )

                # Step 5: Credit receiver
                Account.objects.filter(pk=to_account.pk).update(
                    current_balance=to_account.current_balance + amount
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
                )

        except Exception as exc:
            return self._error(f"Transfer failed: {exc}")

        return Response(
            {"message": "Transfer completed successfully."},
            status=status.HTTP_201_CREATED,
        )

    # ── External (other bank) ─────────────────────────────────────────────────

    def _external(self, from_account, data, amount, reference):
        recipient_name = (data.get("recipientName") or "").strip()
        sort_code = (data.get("sortCode") or "").strip()
        account_number = (data.get("accountNumber") or "").strip()
        print(recipient_name, sort_code, account_number)
        # Step 1b: Validate external fields
        if not recipient_name:
            return self._error("Recipient name is required.")

        if not re.fullmatch(r"\d{2}-\d{2}-\d{2}", sort_code):
            return self._error("Sort code must be in the format 12-34-56.")

        if not re.fullmatch(r"\d{8}", account_number):
            return self._error("Account number must be exactly 8 digits.")

        # Get target account
        to_account = Account.objects.filter(
            account_number=account_number, status="active"
        ).first()
        print("XDXDXD", to_account)
        if not to_account:
            return self._error("Destination account not found.")

        if from_account.pk == to_account.pk:
            return self._error("Cannot transfer to the same account.")

        try:
            # Step 4: Deduct from sender
            Account.objects.filter(pk=from_account.pk).update(
                current_balance=from_account.current_balance - amount
            )

            # Credit recipent
            Account.objects.filter(pk=to_account.pk).update(
                current_balance=to_account.current_balance + amount
            )

            Transaction.objects.create(
                transaction_type="bank_transfer",
                status="completed",
                direction="outgoing",
                amount=amount,
                timestamp=timezone.now(),
                from_account=from_account,
                to_account=to_account,
                payer_name=from_account.name,
                payee_name=recipient_name,
                payment_reference=reference,
                sort_code_masked="**-**-" + sort_code[-2:],
                account_number_masked="****" + account_number[-4:],
                description=f"Bank transfer to {recipient_name}",
                balance_after=from_account.current_balance - amount,
            )

            abc = Transaction.objects.create(
                transaction_type="bank_transfer",
                status="completed",
                direction="incoming",
                amount=amount,
                timestamp=timezone.now(),
                from_account=to_account,
                to_account=from_account,
                payer_name=recipient_name,
                payee_name=from_account.name,
                payment_reference=reference,
                sort_code_masked="**-**-" + sort_code[-2:],
                account_number_masked="****" + account_number[-4:],
                description=f"Bank transfer from {recipient_name}",
                balance_after=to_account.current_balance + amount,
            )
            print(abc)

        except Exception as exc:
            return self._error(f"Transfer failed: {exc}")

        return Response(
            {"message": "Bank transfer submitted successfully."},
            status=status.HTTP_201_CREATED,
        )

    # ── Helper ────────────────────────────────────────────────────────────────

    def _error(self, message, http_status=status.HTTP_400_BAD_REQUEST):
        return Response({"error": message}, status=http_status)
