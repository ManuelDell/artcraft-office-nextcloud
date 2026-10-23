# Nextcloud-App `wordcraft` — Office-Integration (OnlyOffice-Ersatz)

Registriert eine **Fileaction** + **Viewer-Embed** für Office-Dateien in Nextcloud 33 und öffnet
den gehosteten WordCraft-WASM-Editor (liegt bereits unter `https://<host>/wordcraft/`, same-origin).

Vollständige Spec: Projekt-Skill `projects/wordcraft-nc` (wird dem Worker als --skill geladen).
Zielsystem: lokal-Nextcloud (.88), NC 33 (branded "Dells Dienste Cloud"), PHP 8.4.
