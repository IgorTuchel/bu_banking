import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models


def generate_hex_uuid():
    """Return a 32-character UUID hex string."""
    return uuid.uuid4().hex


def generate_account_number():
    """Generate a unique 8-digit account number."""
    return str(uuid.uuid4().int)[:8]


def generate_sort_code():
    return "20-00-00"


class Account(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ("current", "Current"),
        ("savings", "Savings"),
        ("credit", "Credit"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("frozen", "Frozen"),
        ("closed", "Closed"),
        ("pending", "Pending"),
    ]

    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_hex_uuid,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="primary_accounts",
    )

    name = models.CharField(max_length=100)
    display_key = models.SlugField(max_length=50, unique=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)

    currency = models.CharField(max_length=3, default="GBP")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    account_number = models.CharField(
        max_length=8,
        unique=True,
        default=generate_account_number,
    )
    sort_code = models.CharField(
        max_length=8,
        default=generate_sort_code,
    )

    starting_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    current_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    round_up_enabled = models.BooleanField(default=False)
    round_up_pot = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    postcode = models.CharField(max_length=10, null=True, blank=True)

    opened_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "banking_account"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.account_type})"

    @property
    def masked_account_number(self):
        return f"•••• {self.account_number[-4:]}"


class AccountUser(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("joint_owner", "Joint Owner"),
        ("viewer", "Viewer"),
    ]

    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="account_users",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="account_memberships",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="owner")

    class Meta:
        db_table = "banking_accountuser"
        unique_together = ("account", "user")
        ordering = ["account", "user"]

    def __str__(self):
        return f"{self.user} -> {self.account} ({self.role})"
    
class UserLoginLocation(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="login_location",
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    location_label = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "banking_userloginlocation"

    def __str__(self):
        return f"Login location for {self.user}"


class SavingsAccountDetails(models.Model):
    account = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        related_name="savings_details",
    )
    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    interest_earned_ytd = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    class Meta:
        db_table = "banking_savingsaccountdetails"

    def __str__(self):
        return f"Savings details for {self.account.name}"


class CreditAccountDetails(models.Model):
    account = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        related_name="credit_details",
    )
    credit_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    available_credit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    minimum_payment_due = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    payment_due_date = models.DateField(null=True, blank=True)
    statement_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    class Meta:
        db_table = "banking_creditaccountdetails"

    def __str__(self):
        return f"Credit details for {self.account.name}"


class Business(models.Model):
    BUSINESS_TYPE_CHOICES = [
        ("retail", "Retail"),
        ("service", "Service"),
        ("ecommerce", "E-commerce"),
        ("digital", "Digital"),
    ]

    id = models.CharField(primary_key=True, max_length=50)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)

    country = models.CharField(max_length=2, blank=True)
    city = models.CharField(max_length=100, blank=True)
    business_type = models.CharField(
        max_length=20,
        choices=BUSINESS_TYPE_CHOICES,
        blank=True,
    )
    online = models.BooleanField(default=False)
    sanctioned = models.BooleanField(default=False)

    postcode = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "banking_business"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Card(models.Model):
    CARD_TYPE_CHOICES = [
        ("debit", "Debit"),
        ("credit", "Credit"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("frozen", "Frozen"),
        ("cancelled", "Cancelled"),
        ("expired", "Expired"),
    ]

    SCHEME_CHOICES = [
        ("visa", "Visa"),
        ("mastercard", "Mastercard"),
        ("amex", "Amex"),
    ]

    LIMIT_PERIOD_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
    ]

    id = models.CharField(
        primary_key=True,
        max_length=32,
        default=generate_hex_uuid,
        editable=False,
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="cards",
    )

    network_card_number = models.CharField(
        max_length=16,
        unique=True,
        null=True,
        blank=True,
    )

    card_type = models.CharField(max_length=20, choices=CARD_TYPE_CHOICES)
    name = models.CharField(max_length=100)
    scheme = models.CharField(max_length=20, choices=SCHEME_CHOICES)

    cardholder_name = models.CharField(max_length=100)
    masked_number = models.CharField(max_length=20)
    expiry = models.CharField(max_length=5)

    color = models.CharField(max_length=30, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )
    frozen = models.BooleanField(default=False)

    contactless_enabled = models.BooleanField(default=True)
    online_payments_enabled = models.BooleanField(default=True)
    atm_withdrawals_enabled = models.BooleanField(default=True)

    spending_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    spending_limit_period = models.CharField(
        max_length=20,
        choices=LIMIT_PERIOD_CHOICES,
        blank=True,
    )
    last_used = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "banking_card"
        ordering = ["account", "name"]

    def generate_network_card_number(self):
        """
        Generate a 16-character card number for the payment network.
        Uses last 4 chars of UUID for simplicity.
        """
        return f"000000000000{self.id[-4:]}"

    def save(self, *args, **kwargs):
        if not self.network_card_number:
            self.network_card_number = self.generate_network_card_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.card_type})"


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ("card_payment", "Card Payment"),
        ("bank_transfer", "Bank Transfer"),
        ("direct_debit", "Direct Debit"),
        ("standing_order", "Standing Order"),
        ("cash_withdrawal", "Cash Withdrawal"),
        ("cash_deposit", "Cash Deposit"),
        ("interest", "Interest"),
        ("fee", "Fee"),
        ("refund", "Refund"),
        ("round_up_transfer", "Round-up Transfer"),
        ("credit_payment", "Credit Card Payment"),
    ]

    STATUS_CHOICES = [
        ("completed", "Completed"),
        ("pending", "Pending"),
        ("declined", "Declined"),
        ("reversed", "Reversed"),
    ]

    DIRECTION_CHOICES = [
        ("incoming", "Incoming"),
        ("outgoing", "Outgoing"),
        ("internal", "Internal"),
    ]

    id = models.BigAutoField(primary_key=True)
    transaction_type = models.CharField(
        max_length=30,
        choices=TRANSACTION_TYPE_CHOICES,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="completed",
    )
    direction = models.CharField(
        max_length=20,
        choices=DIRECTION_CHOICES,
        blank=True,
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField()

    from_account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="outgoing_transactions",
        null=True,
        blank=True,
    )
    to_account = models.ForeignKey(
        Account,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incoming_transactions",
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    card = models.ForeignKey(
        Card,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )

    description = models.CharField(max_length=255, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    terminal_id = models.CharField(max_length=50, blank=True)

    payer_name = models.CharField(max_length=100, blank=True)
    payee_name = models.CharField(max_length=100, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)

    sort_code_masked = models.CharField(max_length=8, blank=True)
    account_number_masked = models.CharField(max_length=20, blank=True)

    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=2, blank=True)

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    location_label = models.CharField(max_length=255, blank=True)

    balance_after = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "banking_transaction"
        ordering = ["-timestamp", "-id"]

    def __str__(self):
        return f"{self.transaction_type} {self.amount} on {self.timestamp}"