import time

from django.core.management.base import BaseCommand

from banking.services.payment_network import (
    acknowledge_queue_item,
    approve_and_deduct,
    decide_authorization,
    get_pending_queue_items,
    respond_to_authorization,
)


class Command(BaseCommand):
    help = "Poll the payment network queue and handle authorize requests."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Poll loop started. Ctrl+C to stop."))

        while True:
            try:
                items = get_pending_queue_items()

                for item in items:
                    self._process(item)

            except KeyboardInterrupt:
                self.stdout.write("Stopped.")
                break
            except Exception as exc:
                self.stderr.write(f"Poll error: {exc}")

            time.sleep(3)

    def _process(self, item):
        item_id = item["id"]
        item_type = item["item_type"]

        if item_type == "transaction_update":
            acknowledge_queue_item(item_id)
            self.stdout.write(f"[{item_id}] ACK transaction_update")
            return

        if item_type == "authorize_request":
            payload = item.get("payload", {})
            self._handle_authorize(item_id, payload)

    def _handle_authorize(self, item_id, payload):
        card_number = payload.get("card_number", "")
        amount = payload.get("amount", 0)

        self.stdout.write(
            f"[{item_id}] authorize_request — card={card_number} amount={amount}"
        )

        approve, code, card, account = decide_authorization(card_number, amount)

        try:
            if approve:
                approve_and_deduct(card, account, amount)

            respond_to_authorization(item_id, approve=approve, response_code=code)

            if approve:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[{item_id}] APPROVED £{amount} from {account.name} (code {code})"
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"[{item_id}] DECLINED — code {code}")
                )

        except Exception as exc:
            self.stderr.write(f"[{item_id}] Failed to respond: {exc}")
            try:
                respond_to_authorization(item_id, approve=False, response_code="05")
            except Exception:
                pass
