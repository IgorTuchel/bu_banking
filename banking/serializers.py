from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Account, Business, Card, Transaction, UserLoginLocation, UserProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "last_login"]
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
            "city",
            "country",
            "latitude",
            "longitude",
            "location_label",
        ]


class CurrentUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    email = serializers.EmailField()

    lastLogin = serializers.DateTimeField(source="last_login", allow_null=True)
    lastLoginLocation = serializers.SerializerMethodField()
    passwordChangedAt = serializers.SerializerMethodField()

    accountStatus = serializers.SerializerMethodField()
    securityLevel = serializers.SerializerMethodField()
    memberSince = serializers.SerializerMethodField()
    dateOfBirth = serializers.SerializerMethodField()

    phoneHome = serializers.SerializerMethodField()
    phoneMobile = serializers.SerializerMethodField()

    houseNumber = serializers.SerializerMethodField()
    flatNumber = serializers.SerializerMethodField()
    streetAddress = serializers.SerializerMethodField()
    townCity = serializers.SerializerMethodField()
    county = serializers.SerializerMethodField()
    postcode = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()

    def _profile(self, obj):
        return getattr(obj, "profile", None)

    def get_lastLoginLocation(self, obj):
        location = getattr(obj, "login_location", None)
        if not location:
            return None

        return {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "locationLabel": location.location_label,
        }

    def get_accountStatus(self, obj):
        profile = self._profile(obj)
        return profile.account_status if profile else "Active"

    def get_securityLevel(self, obj):
        profile = self._profile(obj)
        return profile.security_level if profile else "High"

    def get_memberSince(self, obj):
        profile = self._profile(obj)
        if profile and profile.member_since:
            return profile.member_since
        return str(obj.date_joined.year) if getattr(obj, "date_joined", None) else "—"

    def get_dateOfBirth(self, obj):
        profile = self._profile(obj)
        return profile.date_of_birth if profile else None

    def get_phoneHome(self, obj):
        profile = self._profile(obj)
        return profile.phone_home if profile else ""

    def get_phoneMobile(self, obj):
        profile = self._profile(obj)
        return profile.phone_mobile if profile else ""

    def get_houseNumber(self, obj):
        profile = self._profile(obj)
        return profile.house_number if profile else ""

    def get_flatNumber(self, obj):
        profile = self._profile(obj)
        return profile.flat_number if profile else ""

    def get_streetAddress(self, obj):
        profile = self._profile(obj)
        return profile.street_address if profile else ""

    def get_townCity(self, obj):
        profile = self._profile(obj)
        return profile.town_city if profile else ""

    def get_county(self, obj):
        profile = self._profile(obj)
        return profile.county if profile else ""

    def get_postcode(self, obj):
        profile = self._profile(obj)
        return profile.postcode if profile else ""

    def get_address(self, obj):
        profile = self._profile(obj)
        if not profile:
            return ""

        parts = [
            profile.flat_number,
            profile.house_number,
            profile.street_address,
            profile.town_city,
            profile.county,
            profile.postcode,
        ]

        return ", ".join([part for part in parts if part])
    
    def get_passwordChangedAt(self, obj):
        profile = self._profile(obj)
        return profile.password_changed_at if profile else None


class UpdateUserProfileSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)

    phoneHome = serializers.CharField(required=False, allow_blank=True, max_length=30)
    phoneMobile = serializers.CharField(required=False, allow_blank=True, max_length=30)

    houseNumber = serializers.CharField(required=False, allow_blank=True, max_length=20)
    flatNumber = serializers.CharField(required=False, allow_blank=True, max_length=20)
    streetAddress = serializers.CharField(required=False, allow_blank=True, max_length=150)
    townCity = serializers.CharField(required=False, allow_blank=True, max_length=100)
    county = serializers.CharField(required=False, allow_blank=True, max_length=100)
    postcode = serializers.CharField(required=False, allow_blank=True, max_length=20)

    def update(self, instance, validated_data):
        user = instance
        profile, _ = UserProfile.objects.get_or_create(user=user)

        if "email" in validated_data:
            user.email = validated_data["email"]
            user.save(update_fields=["email"])

        field_map = {
            "phoneHome": "phone_home",
            "phoneMobile": "phone_mobile",
            "houseNumber": "house_number",
            "flatNumber": "flat_number",
            "streetAddress": "street_address",
            "townCity": "town_city",
            "county": "county",
            "postcode": "postcode",
        }

        changed_fields = []

        for frontend_key, model_field in field_map.items():
            if frontend_key in validated_data:
                setattr(profile, model_field, validated_data[frontend_key])
                changed_fields.append(model_field)

        if changed_fields:
            profile.save(update_fields=[*changed_fields, "updated_at"])

        return user


class ChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(required=True, write_only=True)
    newPassword = serializers.CharField(required=True, write_only=True)
    confirmPassword = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user

        if not user.check_password(attrs["currentPassword"]):
            raise serializers.ValidationError(
                {"currentPassword": "Current password is incorrect."}
            )

        if attrs["newPassword"] != attrs["confirmPassword"]:
            raise serializers.ValidationError(
                {"confirmPassword": "New passwords do not match."}
            )

        validate_password(attrs["newPassword"], user)
        return attrs

    def save(self):
        from django.utils import timezone

        user = self.context["request"].user
        user.set_password(self.validated_data["newPassword"])
        user.save(update_fields=["password"])

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.password_changed_at = timezone.now()
        profile.save(update_fields=["password_changed_at", "updated_at"])

        return user


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
        return getattr(obj, "savings_details", None) and obj.savings_details.interest_rate

    def get_interestEarnedYtd(self, obj):
        return getattr(obj, "savings_details", None) and obj.savings_details.interest_earned_ytd

    def get_creditLimit(self, obj):
        return getattr(obj, "credit_details", None) and obj.credit_details.credit_limit

    def get_availableCredit(self, obj):
        return getattr(obj, "credit_details", None) and obj.credit_details.available_credit

    def get_minimumPaymentDue(self, obj):
        return getattr(obj, "credit_details", None) and obj.credit_details.minimum_payment_due

    def get_paymentDueDate(self, obj):
        return getattr(obj, "credit_details", None) and obj.credit_details.payment_due_date

    def get_statementBalance(self, obj):
        return getattr(obj, "credit_details", None) and obj.credit_details.statement_balance


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
    sortCodeMasked = serializers.CharField(source="sort_code_masked", allow_blank=True)
    accountNumberMasked = serializers.CharField(source="account_number_masked", allow_blank=True)
    paymentReference = serializers.CharField(source="payment_reference", allow_blank=True)
    payerName = serializers.CharField(source="payer_name", allow_blank=True)
    payeeName = serializers.CharField(source="payee_name", allow_blank=True)
    terminalId = serializers.CharField(source="terminal_id", allow_blank=True)

    locationLabel = serializers.CharField(source="location_label", allow_blank=True)

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
            "latitude",
            "longitude",
            "locationLabel",
            "description",
            "cleanDescription",
        ]

    def _viewed_account(self):
        return self.context.get("account")

    def _clean_legacy_description(self, obj):
        return (obj.description or "").split(" | legacy:", 1)[0].strip()

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
        clean = self._clean_legacy_description(obj)
        return clean if clean else obj.transaction_type.replace("_", " ").title()

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
            if (obj.card and obj.card.card_type == "credit") or (
                viewed_account and viewed_account.account_type == "credit"
            ):
                return "Credit Card"
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

        return mapping.get(obj.transaction_type, obj.transaction_type.replace("_", " ").title())

    def get_transferDirection(self, obj):
        return obj.direction.title() if obj.direction else None

    def get_merchantId(self, obj):
        return obj.business.id if obj.business else None

    def get_merchantName(self, obj):
        return obj.business.name if obj.business else None

    def get_merchant(self, obj):
        return FrontendMerchantSerializer(obj.business).data if obj.business else None

    def get_cleanDescription(self, obj):
        return self._clean_legacy_description(obj)


class FrontendCardSerializer(serializers.ModelSerializer):
    accountId = serializers.CharField(source="account.id")
    type = serializers.SerializerMethodField()
    maskedNumber = serializers.SerializerMethodField()
    networkCardNumber = serializers.CharField(source="network_card_number", read_only=True)
    cardholderName = serializers.CharField(source="cardholder_name")
    contactlessEnabled = serializers.BooleanField(source="contactless_enabled")
    onlinePaymentsEnabled = serializers.BooleanField(source="online_payments_enabled")
    atmWithdrawalsEnabled = serializers.BooleanField(source="atm_withdrawals_enabled")
    spendingLimit = serializers.DecimalField(
        source="spending_limit",
        max_digits=12,
        decimal_places=2,
        allow_null=True,
    )
    spendingLimitPeriod = serializers.CharField(source="spending_limit_period")
    lastUsed = serializers.DateTimeField(source="last_used", allow_null=True)

    class Meta:
        model = Card
        fields = [
            "id",
            "accountId",
            "type",
            "name",
            "scheme",
            "cardholderName",
            "maskedNumber",
            "networkCardNumber",
            "expiry",
            "color",
            "status",
            "frozen",
            "contactlessEnabled",
            "onlinePaymentsEnabled",
            "atmWithdrawalsEnabled",
            "spendingLimit",
            "spendingLimitPeriod",
            "lastUsed",
        ]

    def get_type(self, obj):
        return "Credit Card" if obj.card_type == "credit" else "Debit Card"

    def get_maskedNumber(self, obj):
        return obj.generated_masked_number