import ast
import re
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction as db_transaction
from django.utils.dateparse import parse_datetime

from banking.models import Account, Business, Card, Transaction


ACCOUNT_ID_MAP = {
    "acc-001": "main-current",
    "acc-002": "super-saver",
    "acc-003": "platinum-credit",
}


def parse_amount(value: str) -> Decimal:
    cleaned = value.replace("£", "").replace(",", "").strip()
    sign = -1 if cleaned.startswith("-") else 1
    cleaned = cleaned.lstrip("+-")
    return Decimal(cleaned) * sign


def map_transaction_type(payment_type: str, category: str, name: str) -> str:
    payment_type = (payment_type or "").strip().lower()
    category = (category or "").strip().lower()
    name = (name or "").strip().lower()

    mapping = {
        "debit card": "card_payment",
        "credit card": "card_payment",
        "recurring card payment": "card_payment",
        "bank transfer": "bank_transfer",
        "direct debit": "direct_debit",
        "standing order": "standing_order",
        "round-up transfer": "round_up_transfer",
        "credit card repayment": "credit_payment",
        "savings deposit": "bank_transfer",
        "savings transfer": "bank_transfer",
        "interest payment": "interest",
        "cash withdrawal": "cash_withdrawal",
        "cash deposit": "cash_deposit",
    }
    if payment_type in mapping:
        return mapping[payment_type]

    if category == "interest":
        return "interest"
    if "refund" in name:
        return "refund"
    return "bank_transfer"


def map_status(value: str) -> str:
    value = (value or "").strip().lower()
    mapping = {
        "completed": "completed",
        "pending": "pending",
        "declined": "declined",
        "reversed": "reversed",
    }
    return mapping.get(value, "completed")


def map_direction(value: str, amount: Decimal) -> str:
    value = (value or "").strip().lower()
    if value in {"incoming", "outgoing", "internal"}:
        return value
    return "incoming" if amount > 0 else "outgoing"


def normalize_js_object_to_python(obj_text: str) -> dict:
    text = obj_text.strip()

    # Quote bare keys: foo: -> "foo":
    text = re.sub(r'([{\s,])([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', text)

    # JS booleans/null -> Python
    text = re.sub(r"\btrue\b", "True", text)
    text = re.sub(r"\bfalse\b", "False", text)
    text = re.sub(r"\bnull\b", "None", text)

    return ast.literal_eval(text)


def extract_objects(file_text: str) -> list[dict]:
    start = file_text.find("[")
    end = file_text.rfind("]")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Could not find transactions array in file.")

    array_text = file_text[start + 1:end]

    objects = []
    depth = 0
    current = []
    in_string = False
    escape = False

    for char in array_text:
        if in_string:
            current.append(char)
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
            current.append(char)
            continue

        if char == "{":
            depth += 1
            current.append(char)
            continue

        if char == "}":
            depth -= 1
            current.append(char)
            if depth == 0:
                obj_text = "".join(current).strip()
                objects.append(normalize_js_object_to_python(obj_text))
                current = []
            continue

        if depth > 0:
            current.append(char)

    return objects


class Command(BaseCommand):
    help = "Import transactions from JS-style transactionsData export"

    def add_arguments(self, parser):
        parser.add_argument(
            "filepath",
            type=str,
            help="Path to transaction data.txt file",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Delete existing transactions before import",
        )

    @db_transaction.atomic
    def handle(self, *args, **options):
        filepath = Path(options["filepath"])

        if not filepath.exists():
            raise CommandError(f"File not found: {filepath}")

        raw_text = filepath.read_text(encoding="utf-8")
        rows = extract_objects(raw_text)

        if options["replace"]:
            self.stdout.write("Deleting existing transactions...")
            Transaction.objects.all().delete()

        accounts_by_legacy_id = {}
        for legacy_id, display_key in ACCOUNT_ID_MAP.items():
            account = Account.objects.filter(display_key=display_key).first()
            if not account:
                raise CommandError(
                    f"Could not find Account with display_key='{display_key}' "
                    f"for legacy id '{legacy_id}'."
                )
            accounts_by_legacy_id[legacy_id] = account

        current_account = accounts_by_legacy_id["acc-001"]
        savings_account = accounts_by_legacy_id["acc-002"]
        credit_account = accounts_by_legacy_id["acc-003"]

        card_by_account = {
            current_account.id: Card.objects.filter(account=current_account).first(),
            credit_account.id: Card.objects.filter(account=credit_account).first(),
        }

        imported = 0
        skipped = 0

        for row in rows:
            legacy_txn_id = row.get("id")
            legacy_account_id = row.get("accountId")

            account = accounts_by_legacy_id.get(legacy_account_id)
            if not account:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {legacy_txn_id}: unknown accountId {legacy_account_id}"
                    )
                )
                continue

            if Transaction.objects.filter(description=f"legacy:{legacy_txn_id}").exists():
                skipped += 1
                continue

            amount = parse_amount(row["amount"])
            payment_type = row.get("paymentType", "")
            category = row.get("category", "")
            name = row.get("name", "")
            transaction_type = map_transaction_type(payment_type, category, name)
            status = map_status(row.get("status", "Completed"))
            direction = map_direction(row.get("transferDirection", ""), amount)

            business = None
            merchant_id = row.get("merchantId")
            if merchant_id:
                business, _ = Business.objects.get_or_create(
                    id=merchant_id,
                    defaults={
                        "name": row.get("name", merchant_id),
                        "category": row.get("category", "Other"),
                        "country": row.get("country", ""),
                        "city": row.get("city", ""),
                        "business_type": "",
                        "online": "ONLINE" in (row.get("terminalId", "") or "").upper(),
                        "sanctioned": False,
                    },
                )

            from_account = account
            to_account = None

            # Internal/account-linked transfer logic
            if transaction_type == "round_up_transfer":
                from_account = current_account
                to_account = savings_account
                direction = "internal"

            elif payment_type == "Savings Deposit":
                from_account = current_account
                to_account = savings_account
                direction = "internal"

            elif payment_type == "Savings Transfer":
                from_account = savings_account
                to_account = current_account
                direction = "internal"

            elif payment_type == "Credit Card Repayment":
                from_account = current_account
                to_account = credit_account
                direction = "internal"

            elif transaction_type == "bank_transfer":
                if direction == "incoming":
                    to_account = account
                else:
                    from_account = account

            elif transaction_type == "interest":
                to_account = account
                direction = "incoming"

            txn_card = None
            if payment_type in {"Debit Card", "Recurring Card Payment"}:
                txn_card = card_by_account.get(current_account.id if account == current_account else account.id)
            elif payment_type == "Credit Card":
                txn_card = card_by_account.get(credit_account.id)

            timestamp = parse_datetime(row["timestamp"])
            if timestamp is None:
                raise CommandError(f"Could not parse timestamp for {legacy_txn_id}: {row['timestamp']}")

            description_parts = [f"legacy:{legacy_txn_id}"]
            mandate_id = row.get("mandateId")
            source_institution = row.get("sourceInstitution")
            source_account = row.get("sourceAccount")
            destination_account = row.get("destinationAccount")

            if mandate_id:
                description_parts.append(f"mandate:{mandate_id}")
            if source_institution:
                description_parts.append(f"sourceInstitution:{source_institution}")
            if source_account:
                description_parts.append(f"sourceAccount:{source_account}")
            if destination_account:
                description_parts.append(f"destinationAccount:{destination_account}")

            description = row.get("name", "")
            if description_parts:
                description = f"{description} | {' | '.join(description_parts)}"

            Transaction.objects.create(
                transaction_type=transaction_type,
                status=status,
                direction=direction,
                amount=abs(amount),
                timestamp=timestamp,
                from_account=from_account,
                to_account=to_account,
                business=business,
                card=txn_card,
                description=description,
                payment_reference=row.get("paymentReference", ""),
                terminal_id=row.get("terminalId", ""),
                payer_name=row.get("payerName", ""),
                payee_name=row.get("payeeName", ""),
                bank_name=row.get("bankName", ""),
                sort_code_masked=row.get("sortCodeMasked", ""),
                account_number_masked=row.get("accountNumberMasked", ""),
                city=row.get("city", ""),
                country=row.get("country", ""),
            )
            imported += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {imported} transactions. Skipped {skipped}."
            )
        )