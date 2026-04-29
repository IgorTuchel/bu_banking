#!/usr/bin/env python3
"""
acr122u-bridge.py
─────────────────
Reads NFC cards via an ACR122U (or any PC/SC NFC reader) and types the NDEF
text content as keystrokes. Pairs with bu-banking-cf /api/webterminal: you
focus the reader zone on the webterminal page, tap a card, the script types
"<bank_id>|<card_number>" + Enter → the page submits a charge.

Why this exists: the ACR122U runs in PC/SC smartcard mode. Windows grabs
the reader as a smartcard device (that's the "mount/unmount" chime), so
nothing lands on the keyboard — the browser never sees the card data.
This script bridges that gap.

Install (any OS)
    pip install pyscard pynput

Windows note: you may need the ACS CCID driver installed — download from
https://www.acs.com.hk/en/drivers/3/acr122u/ if Windows doesn't recognise
the reader. The "mount/unmount" sound means the driver is already working.

Run
    python acr122u-bridge.py

Leave it running. Open /api/webterminal in your browser, click the USB NFC
reader zone (so it shows "Listening — tap a card"), then tap a card.
Ctrl-C to stop the script.
"""
from __future__ import annotations

import sys
import time

try:
    from smartcard.CardMonitoring import CardMonitor, CardObserver
    from smartcard.CardConnection import CardConnection
    from smartcard.util import toHexString
    from smartcard.Exceptions import CardConnectionException, NoCardException
except ImportError:
    print("pyscard not installed. Run: pip install pyscard")
    sys.exit(1)

try:
    from pynput.keyboard import Controller, Key
except ImportError:
    print("pynput not installed. Run: pip install pynput")
    sys.exit(1)


kbd = Controller()


def read_block(connection, block: int) -> bytes:
    """Read 4 bytes from an NTAG2xx block via the ACR122U read-binary APDU."""
    # FF B0 00 <block> 04 — Type-2 tag pseudo-APDU
    data, sw1, sw2 = connection.transmit([0xFF, 0xB0, 0x00, block, 0x04])
    if (sw1, sw2) != (0x90, 0x00):
        raise IOError(f"block {block}: status {sw1:02X}{sw2:02X}")
    return bytes(data)


def read_ndef_text(connection) -> str | None:
    """Read blocks 4..39 on an NTAG2xx, walk the TLVs, return the first Text record."""
    raw = bytearray()
    for block in range(4, 40):
        try:
            raw.extend(read_block(connection, block))
        except IOError:
            break

    # Walk the TLV structure looking for an NDEF Message (tag 0x03).
    i = 0
    while i < len(raw):
        t = raw[i]
        if t == 0x00:          # null TLV — skip padding
            i += 1
            continue
        if t == 0xFE:          # terminator TLV
            return None
        if t == 0x03:          # NDEF Message TLV
            i += 1
            if i >= len(raw):
                return None
            if raw[i] == 0xFF and i + 2 < len(raw):
                length = (raw[i + 1] << 8) | raw[i + 2]
                i += 3
            else:
                length = raw[i]
                i += 1
            return _extract_text(raw[i:i + length])
        # Unknown TLV, try to skip past it
        i += 1
        if i < len(raw):
            skip = raw[i]
            i += 1 + skip
    return None


def _extract_text(msg: bytes) -> str | None:
    """Find the first Text ('T') record in an NDEF message and return its text."""
    for i in range(len(msg) - 2):
        if msg[i] == 0x54:  # 'T'
            if i + 1 >= len(msg):
                return None
            lang_len = msg[i + 1] & 0x3F
            start = i + 2 + lang_len
            blob = msg[start:]
            # trim trailing terminator / padding
            blob = blob.split(b"\xFE", 1)[0].rstrip(b"\x00")
            return blob.decode("utf-8", "replace")
    return None


class Observer(CardObserver):
    def __init__(self) -> None:
        self.last_sent_at = 0.0

    def update(self, observable, actions):  # noqa: D401, ARG002
        added, _removed = actions
        for card in added:
            try:
                conn = card.createConnection()
                # ACR122U reading NTAG2xx needs T=1 (contactless protocol).
                # Default negotiation sometimes lands on T=0 and transmit
                # fails with "Access is denied".
                conn.connect(CardConnection.T1_protocol)
                text = read_ndef_text(conn)
                conn.disconnect()
            except (CardConnectionException, NoCardException) as e:
                print(f"[warn] {e}")
                continue

            if not text:
                print(f"[tag {toHexString(card.atr)}] no NDEF text record on this card")
                continue

            # Debounce — the reader sometimes double-fires on a single tap.
            now = time.time()
            if now - self.last_sent_at < 0.6:
                continue
            self.last_sent_at = now

            print(f"[tap] → {text}")
            # Give the browser a beat to receive focus state, then type.
            time.sleep(0.1)
            kbd.type(text)
            kbd.press(Key.enter)
            kbd.release(Key.enter)


def main() -> None:
    print("Listening for NFC taps via PC/SC (ACR122U).")
    print("Focus the /api/webterminal reader zone, then tap a card. Ctrl-C to stop.")
    monitor = CardMonitor()
    monitor.addObserver(Observer())
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print()


if __name__ == "__main__":
    main()
