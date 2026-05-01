from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from banking.models import Account, Card, Transaction, UserProfile
from banking.serializers import (
    ChangePasswordSerializer,
    CurrentUserSerializer,
    FrontendAccountSerializer,
    FrontendCardSerializer,
    FrontendTransactionSerializer,
    UpdateUserProfileSerializer,
)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def _ensure_profile(self, user):
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "account_status": "Active",
                "security_level": "High",
                "member_since": str(user.date_joined.year),
                "phone_home": "",
                "phone_mobile": "",
                "house_number": "",
                "flat_number": "",
                "street_address": "",
                "town_city": "",
                "county": "",
                "postcode": "",
            },
        )

    def get(self, request):
        user = request.user

        if not user.last_login:
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

        self._ensure_profile(user)

        serializer = CurrentUserSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        self._ensure_profile(user)

        serializer = UpdateUserProfileSerializer(
            user,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()

        return Response(CurrentUserSerializer(user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()

        return Response(
            {"message": "Password changed successfully."},
            status=200,
        )


class AccountListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        accounts = (
            Account.objects.filter(user=request.user)
            .select_related("savings_details", "credit_details")
            .order_by("name")
        )
        serializer = FrontendAccountSerializer(accounts, many=True)
        return Response(serializer.data)


class AccountDetailByKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, display_key):
        account = (
            Account.objects.select_related("savings_details", "credit_details")
            .filter(display_key=display_key, user=request.user)
            .first()
        )

        if not account:
            return Response({"detail": "Account not found."}, status=404)

        serializer = FrontendAccountSerializer(account)
        return Response(serializer.data)


class AccountTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, account_id):
        account = Account.objects.filter(id=account_id, user=request.user).first()

        if not account:
            return Response({"detail": "Account not found."}, status=404)

        if account.account_type == "current":
            transactions = (
                Transaction.objects.filter(
                    Q(from_account=account, direction="outgoing")
                    | Q(to_account=account, direction="incoming")
                    | Q(from_account=account, transaction_type="card_payment")
                    | Q(from_account=account, transaction_type="direct_debit")
                    | Q(from_account=account, transaction_type="standing_order")
                    | Q(from_account=account, transaction_type="cash_withdrawal")
                    | Q(to_account=account, transaction_type="cash_deposit")
                    | Q(to_account=account, transaction_type="refund")
                )
                .exclude(direction="internal")
                .select_related("business", "card", "from_account", "to_account")
                .order_by("-timestamp", "-id")
            )
        else:
            transactions = (
                Transaction.objects.filter(
                    Q(from_account=account) | Q(to_account=account)
                )
                .select_related("business", "card", "from_account", "to_account")
                .order_by("-timestamp", "-id")
            )

        serializer = FrontendTransactionSerializer(
            transactions,
            many=True,
            context={"account": account},
        )
        return Response(serializer.data)


class AccountCardsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, account_id):
        account = Account.objects.filter(id=account_id, user=request.user).first()

        if not account:
            return Response({"detail": "Account not found."}, status=404)

        cards = Card.objects.filter(account=account).order_by("name")
        serializer = FrontendCardSerializer(cards, many=True)
        return Response(serializer.data)


class CardUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, card_id):
        card = Card.objects.filter(id=card_id, account__user=request.user).first()

        if not card:
            return Response({"detail": "Card not found"}, status=404)

        allowed_fields = {
            "frozen": "frozen",
            "contactlessEnabled": "contactless_enabled",
            "onlinePaymentsEnabled": "online_payments_enabled",
            "atmWithdrawalsEnabled": "atm_withdrawals_enabled",
            "spendingLimit": "spending_limit",
            "spendingLimitPeriod": "spending_limit_period",
        }

        for frontend_key, model_field in allowed_fields.items():
            if frontend_key in request.data:
                setattr(card, model_field, request.data[frontend_key])

        card.save()

        serializer = FrontendCardSerializer(card)
        return Response(serializer.data)


class TestTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        card_number = request.data.get("card_number")
        amount = request.data.get("amount", 10.00)

        card = Card.objects.filter(
            network_card_number=card_number,
            account__user=request.user,
        ).first()

        if not card:
            return Response({"error": "Card not found"}, status=400)

        txn = Transaction.objects.create(
            transaction_type="card_payment",
            status="completed",
            direction="outgoing",
            amount=amount,
            timestamp=timezone.now(),
            from_account=card.account,
            to_account=None,
            business=None,
            card=card,
            description="TEST TRANSACTION FROM BASH",
            payment_reference="TEST",
        )

        return Response({"success": True, "transaction_id": txn.id})