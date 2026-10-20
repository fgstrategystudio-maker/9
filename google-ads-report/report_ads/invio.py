"""Invio dei report via email (SMTP, gratuito con Gmail e una password per le app)."""

from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from pathlib import Path


class Mittente:
    def __init__(self) -> None:
        self.utente = os.environ.get("SMTP_USER", "")
        self.password = os.environ.get("SMTP_PASSWORD", "")
        self.host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.porta = int(os.environ.get("SMTP_PORT", "465"))
        self.nome = os.environ.get("SMTP_FROM_NAME", "")

    @property
    def configurato(self) -> bool:
        return bool(self.utente and self.password)

    def invia(self, a: list[str], oggetto: str, html: str, allegato: Path | None = None,
              ccn: list[str] | None = None) -> None:
        msg = EmailMessage()
        msg["From"] = f"{self.nome} <{self.utente}>" if self.nome else self.utente
        msg["To"] = ", ".join(a)
        msg["Subject"] = oggetto
        msg.set_content("Questo report è in formato HTML: aprilo con un client email che lo supporta.")
        msg.add_alternative(html, subtype="html")
        if allegato:
            msg.add_attachment(allegato.read_bytes(), maintype="text", subtype="html", filename=allegato.name)
        destinatari = a + (ccn or [])
        with smtplib.SMTP_SSL(self.host, self.porta, timeout=60) as s:
            s.login(self.utente, self.password)
            s.send_message(msg, to_addrs=destinatari)
