from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Account, Business, Transaction


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id"]


class AccountSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source="user", read_only=True)
    account_type_display = serializers.CharField(
        source="get_account_type_display",
        read_only=True,
    )

    class Meta:
        model = Account
        fields = [
            "id",
            "name",
            "starting_balance",
            "round_up_enabled",
            "postcode",
            "user",
            "user_details",
            "account_type",
            "account_type_display",
            "round_up_pot",
        ]


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ["id", "name", "category", "sanctioned"]


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "transaction_type",
            "amount",
            "from_account",
            "to_account",
            "business",
            "timestamp",
        ]


class CurrentUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    email = serializers.EmailField()
    lastLogin = serializers.DateTimeField(source="last_login", allow_null=True)


class FrontendAccountSerializer(serializers.ModelSerializer):
    key = serializers.CharField(source="display_key")
    type = serializers.CharField(source="account_type")
    currentBalance = serializers.DecimalField(
        source="current_balance",
        max_digits=12,
        decimal_places=2,
    )
    accountNumber = serializers.CharField(source="account_number")
    maskedAccountNumber = serializers.SerializerMethodField()
    sortCode = serializers.CharField(source="sort_code")

    interestRate = serializers.SerializerMethodField()
    interestEarnedYtd = serializers.SerializerMethodField()
    creditLimit = serializers.SerializerMethodField()
    availableCredit = serializers.SerializerMethodField()
    minimumPaymentDue = serializers.SerializerMethodField()
    paymentDueDate = serializers.SerializerMethodField()
    statementBalance = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = [
            "id",
            "key",
            "name",
            "type",
            "currency",
            "currentBalance",
            "accountNumber",
            "maskedAccountNumber",
            "sortCode",
            "status",
            "interestRate",
            "interestEarnedYtd",
            "creditLimit",
            "availableCredit",
            "minimumPaymentDue",
            "paymentDueDate",
            "statementBalance",
        ]

    def get_maskedAccountNumber(self, obj):
        return obj.masked_account_number

    def get_interestRate(self, obj):
        if hasattr(obj, "savings_details"):
            return obj.savings_details.interest_rate
        return None

    def get_interestEarnedYtd(self, obj):
        if hasattr(obj, "savings_details"):
            return obj.savings_details.interest_earned_ytd
        return None

    def get_creditLimit(self, obj):
        if hasattr(obj, "credit_details"):
            return obj.credit_details.credit_limit
        return None

    def get_availableCredit(self, obj):
        if hasattr(obj, "credit_details"):
            return obj.credit_details.available_credit
        return None

    def get_minimumPaymentDue(self, obj):
        if hasattr(obj, "credit_details"):
            return obj.credit_details.minimum_payment_due
        return None

    def get_paymentDueDate(self, obj):
        if hasattr(obj, "credit_details"):
            return obj.credit_details.payment_due_date
        return None

    def get_statementBalance(self, obj):
        if hasattr(obj, "credit_details"):
            return obj.credit_details.statement_balance
        return None


class FrontendMerchantSerializer(serializers.Serializer):
    merchantId = serializers.CharField(source="id")
    name = serializers.CharField()
    category = serializers.CharField()
    country = serializers.CharField(allow_blank=True)
    city = serializers.CharField(allow_blank=True)
    type = serializers.CharField(source="business_type", allow_blank=True)
    online = serializers.BooleanField()


class FrontendTransactionSerializer(serializers.ModelSerializer):
    accountId = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    paymentType = serializers.SerializerMethodField()
    transferDirection = serializers.SerializerMethodField()

    bankName = serializers.CharField(source="bank_name", allow_blank=True)
    sortCodeMasked = serializers.CharField(
        source="sort_code_masked",
        allow_blank=True,
    )
    accountNumberMasked = serializers.CharField(
        source="account_number_masked",
        allow_blank=True,
    )
    paymentReference = serializers.CharField(
        source="payment_reference",
        allow_blank=True,
    )
    payerName = serializers.CharField(source="payer_name", allow_blank=True)
    payeeName = serializers.CharField(source="payee_name", allow_blank=True)
    terminalId = serializers.CharField(source="terminal_id", allow_blank=True)

    merchantId = serializers.SerializerMethodField()
    merchantName = serializers.SerializerMethodField()
    merchant = serializers.SerializerMethodField()
    cleanDescription = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "accountId",
            "name",
            "category",
            "amount",
            "timestamp",
            "status",
            "paymentType",
            "transferDirection",
            "bankName",
            "sortCodeMasked",
            "accountNumberMasked",
            "paymentReference",
            "payerName",
            "payeeName",
            "merchantId",
            "merchantName",
            "merchant",
            "terminalId",
            "city",
            "country",
            "description",
            "cleanDescription",
        ]

    def _viewed_account(self):
        return self.context.get("account")

    def _clean_legacy_description(self, obj):
        raw_description = obj.description or ""
        return raw_description.split(" | legacy:", 1)[0].strip()

    def get_accountId(self, obj):
        account = self._viewed_account()
        return account.id if account else None

    def get_name(self, obj):
        if obj.transaction_type == "bank_transfer" and obj.payer_name:
            return f"Transfer from {obj.payer_name}"

        if obj.transaction_type == "bank_transfer" and obj.payee_name:
            return f"Transfer to {obj.payee_name}"

        if obj.business:
            return obj.business.name

        clean_description = self._clean_legacy_description(obj)
        if clean_description:
            return clean_description

        return obj.transaction_type.replace("_", " ").title()

    def get_category(self, obj):
        if obj.business:
            return obj.business.category

        if obj.transaction_type in {"bank_transfer", "round_up_transfer"}:
            return "Transfer"

        if obj.transaction_type == "credit_payment":
            return "Payment"

        if obj.transaction_type == "interest":
            return "Interest"

        return obj.transaction_type.replace("_", " ").title()

    def get_amount(self, obj):
        account = self._viewed_account()
        if not account:
            return f"£{obj.amount:.2f}"

        sign = "-"
        if obj.to_account_id == account.id and obj.from_account_id != account.id:
            sign = "+"
        elif obj.transaction_type in {"interest", "refund"}:
            sign = "+"

        return f"{sign}£{obj.amount:.2f}"

    def get_status(self, obj):
        return obj.status.title()

    def get_paymentType(self, obj):
        viewed_account = self._viewed_account()

        if obj.transaction_type == "card_payment":
            if (
                (obj.card and obj.card.card_type == "credit")
                or (viewed_account and viewed_account.account_type == "credit")
            ):
                return "Credit Card"
            if obj.card and obj.card.card_type == "debit":
                return "Debit Card"
            return "Debit Card"

        mapping = {
            "bank_transfer": "Bank Transfer",
            "direct_debit": "Direct Debit",
            "standing_order": "Standing Order",
            "cash_withdrawal": "Cash Withdrawal",
            "cash_deposit": "Cash Deposit",
            "interest": "Interest Payment",
            "fee": "Fee",
            "refund": "Refund",
            "round_up_transfer": "Round-up Transfer",
            "credit_payment": "Credit Card Repayment",
        }
        return mapping.get(
            obj.transaction_type,
            obj.transaction_type.replace("_", " ").title(),
        )

    def get_transferDirection(self, obj):
        if obj.direction == "incoming":
            return "Incoming"
        if obj.direction == "outgoing":
            return "Outgoing"
        if obj.direction == "internal":
            return "Internal"
        return None

    def get_merchantId(self, obj):
        return obj.business.id if obj.business else None

    def get_merchantName(self, obj):
        return obj.business.name if obj.business else None

    def get_merchant(self, obj):
        if not obj.business:
            return None
        return FrontendMerchantSerializer(obj.business).data

    def get_cleanDescription(self, obj):
        return self._clean_legacy_description(obj)