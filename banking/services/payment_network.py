import os
from decimal import Decimal, InvalidOperation

import requests
from django.db import transaction as db_transaction
from django.utils import timezone
from dotenv import load_dotenv

from banking.models import Account, Card, Transaction

load_dotenv("credentials.env")

BASE_URL = os.getenv("PAYMENT_NETWORK_BASE_URL", "https://paymentsystem-cf.pages.dev")
API_KEY = os.getenv("PAYMENT_NETWORK_API_KEY")
BANK_ID = os.getenv("PAYMENT_NETWORK_BANK_ID")


# ── Card → Account lookup ─────────────────────────────────────────────────────


def get_card_and_account(card_number):
    """Return (card, account) for a 16-char network card number, or (None, None)."""
    if not card_number or len(card_number) != 16:
        return None, None

    card = (
        Card.objects.select_related("account")
        .filter(network_card_number=card_number)
        .first()
    )

    if not card:
        return None, None

    return card, card.account


# ── Authorization decision ────────────────────────────────────────────────────


def decide_authorization(card_number, amount_raw):
    """
    Returns (approve: bool, response_code: str, card, account).
    Does NOT mutate the DB — the caller must deduct the balance on approval.
    """
    try:
        amount = Decimal(str(amount_raw))
    except (InvalidOperation, TypeError, ValueError):
        return False, "13", None, None

    if amount <= 0:
        return False, "13", None, None

    card, account = get_card_and_account(card_number)

    if not card or not account:
        return False, "14", None, None

    if account.current_balance < amount:
        return False, "51", card, account

    return True, "00", card, account


def approve_and_deduct(card, account, amount):
    """Atomically deduct balance and record the transaction."""
    amount = Decimal(str(amount))

    with db_transaction.atomic():
        Account.objects.filter(pk=account.pk).update(
            current_balance=account.current_balance - amount
        )
        Transaction.objects.create(
            transaction_type="card_payment",
            status="completed",
            direction="outgoing",
            amount=amount,
            timestamp=timezone.now(),
            from_account=account,
            card=card,
            description="Card payment via payment network",
            balance_after=account.current_balance - amount,
        )


# ── Network API calls ─────────────────────────────────────────────────────────


def _headers():
    return {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
    }


def get_pending_queue_items():
    response = requests.get(
        f"{BASE_URL}/api/queue/pending",
        headers=_headers(),
        timeout=15,
    )
    response.raise_for_status()
    return response.json().get("items", [])


def respond_to_authorization(queue_item_id, approve, response_code):
    response = requests.post(
        f"{BASE_URL}/api/queue/authorize/{queue_item_id}/respond",
        headers=_headers(),
        json={"approve": approve, "response_code": response_code},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def acknowledge_queue_item(queue_item_id):
    response = requests.post(
        f"{BASE_URL}/api/queue/ack/{queue_item_id}",
        headers=_headers(),
        timeout=15,
    )
    response.raise_for_status()
    return response.json() if response.content else {}


def initiate_transfer(card_number, amount, merchant_id, acquiring_bank_id):
    """Initiate an outgoing transfer via the payment network."""
    response = requests.post(
        f"{BASE_URL}/api/authorize",
        headers=_headers(),
        json={
            "amount": float(amount),
            "card_number": card_number,
            "merchant_id": merchant_id,
            "issuing_bank_id": BANK_ID,
            "acquiring_bank_id": acquiring_bank_id,
        },
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def list_banks():
    response = requests.get(f"{BASE_URL}/api/banks", timeout=15)
    response.raise_for_status()
    return response.json()


def get_my_bank():
    response = requests.get(f"{BASE_URL}/api/banks/me", headers=_headers(), timeout=15)
    response.raise_for_status()
    return response.json()
