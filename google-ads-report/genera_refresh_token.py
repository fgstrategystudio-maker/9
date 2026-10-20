"""Genera il refresh token OAuth per la Google Ads API (da eseguire una volta, sul tuo computer).

    pip install google-auth-oauthlib
    python genera_refresh_token.py

Ti chiede Client ID e Client Secret (client OAuth di tipo "App desktop"),
apre il browser per il consenso con l'utente Google che ha accesso al tuo
account amministratore (MCC) e stampa il refresh token da salvare nel Secret
GOOGLE_ADS_REFRESH_TOKEN.
"""

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPE = ["https://www.googleapis.com/auth/adwords"]

client_id = input("Client ID: ").strip()
# Visibile di proposito: su Windows incollare in un campo nascosto spesso non funziona.
client_secret = input("Client Secret (inizia con GOCSPX-): ").strip()
if not client_secret.startswith("GOCSPX-"):
    print("Attenzione: il Client Secret di solito inizia con GOCSPX-. Controlla di aver incollato quello giusto.")

flow = InstalledAppFlow.from_client_config(
    {"installed": {
        "client_id": client_id,
        "client_secret": client_secret,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }},
    scopes=SCOPE,
)
credenziali = flow.run_local_server(port=0, prompt="consent", access_type="offline")
print("\nRefresh token (copialo nel Secret GOOGLE_ADS_REFRESH_TOKEN):\n")
print(credenziali.refresh_token)
