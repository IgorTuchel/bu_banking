# Activating the Local NFC Terminal

This is a tiny POS terminal you run on your own laptop. It listens on a local web page; when you click "Tap card", it reads a card from your USB NFC reader and submits the charge to the lab's payment network.

## 1. What you need

- A laptop running **macOS, Linux, or Windows**
- **Python 3.9+** installed (`python --version` to check)
- A **USB NFC reader** (ACR122U, ACR1252U, NC001, or similar PC/SC reader)
- The two files from the project: `local-terminal.py` and `requirements.txt`

## 2. One-time setup

Open a terminal (Terminal on macOS, any shell on Linux, PowerShell on Windows) in the folder where you saved the files.

**Install the dependency** (one line, all OSes):

```
pip install -r requirements.txt
```

**Then OS-specific bits:**

- **macOS** — nothing else. Just plug in the reader.
- **Linux** —
  ```
  sudo apt install pcscd libpcsclite-dev
  sudo systemctl start pcscd
  ```
- **Windows** — the Smart Card service (`SCardSvr`) is on by default; nothing to do unless you've previously run Zadig on the reader. If you have, revert that reader's driver to `Microsoft Usbccid Smartcard Reader (WUDF)` in Device Manager — WinUSB-bound readers won't show up.

## 3. Plug in the reader

Plug your USB NFC reader into the laptop **before** you start the script. macOS/Linux/Windows will all detect it automatically — no driver download needed.

## 4. Start the terminal

In the same folder, run:

```
python local-terminal.py
```

You should see something like:

```
Reader 0: ACS ACR122U PICC Interface (selected)
Remote terminal: https://bu-banking-cf.pages.dev/api/terminal/charge
Serving UI on http://127.0.0.1:47823  (Ctrl-C to stop)
```

Leave that window open — closing it shuts the terminal down.

## 5. Open the UI

In any browser **on the same laptop**, go to:

```
http://localhost:47823
```

You'll get a POS-style page: amount keypad, reader dropdown, "Credit to" team selector, and a **Tap card** button.

## 6. Run a charge

1. Pick your reader from the dropdown (usually pre-selected). Click ⟳ if you plugged it in after the page loaded.
2. Pick the team you want the money credited to in **Credit to**.
3. Type an amount on the keypad (`CLR` to reset, `⌫` to backspace).
4. Click **Tap card**.
5. Tap a card on the reader within 30 seconds.
6. You'll see **APPROVED** (green) with an auth code, **Declined** (red) with a reason, or a timeout error.

## 7. Stopping it

Go back to the terminal window and hit **Ctrl-C**.

---

## Optional tweaks (env vars)

Override defaults at launch if needed:

```
PORT=8765 ADMIN_KEY=hunter2 python local-terminal.py
```

| Var | Default | Meaning |
|---|---|---|
| `PORT` | `47823` | Port the local web page listens on |
| `ADMIN_KEY` | `dupachuj` | Auth key for the lab endpoint (default works for class) |
| `TAP_TIMEOUT` | `30` | Seconds to wait for a tap |
| `TERMINAL_URL` | lab default | Where charges get POSTed |

## Troubleshooting

- **"no PC/SC reader connected"** — reader isn't plugged in, or (Linux) `pcscd` isn't running, or (Windows) the reader is on a WinUSB driver from Zadig.
- **Dropdown says "(no readers detected)"** — same as above; click ⟳ after fixing.
- **"no NDEF text record on tag"** — the card isn't a class-issued card, or it hasn't been written yet.
- **"no card tapped within timeout"** — you took longer than 30 s; click Tap card again.
- **Page won't load** — make sure the script is still running in the terminal and you're hitting `localhost`, not a remote address.
