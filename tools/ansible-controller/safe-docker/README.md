# Safe Docker Composes (safe-docker)

Zweck
-----
Die Dateien in diesem Ordner sind *optionale*, modulare Docker Compose Fragmente. Sie dienen dazu, einzelne Services gezielt (und isoliert) auszurollen, ohne die komplette Installation zu ändern.

Grundprinzip
------------
- Alle Dateien sind "safe": Sie werden **nicht automatisch** mit dem Haupt-Compose deployed.
- Verwendung: docker compose -f <main-compose>.yml -f tools/ansible-controller/safe-docker/<6-file>.yml up -d
- Benennung: Nummern geben Ordnung, `6-...` steht für zusätzliche optionale Services (Beispiel: `6-docker-compose.n8n.yml`).
- Keine Duplikate: Füge Services nicht in mehrere safe-Dateien ein; ergänze stattdessen die gewünschte 6-Variante.

n8n-Spezifisch
--------------
- `6-docker-compose.n8n.yml` enthält ausschließlich den n8n-Service (Traefik-Labels, Healthcheck, Volume `n8n-data`).
- Wenn du eine eigene angepasste n8n-Image bauen willst, benutze die Dockerfile unter `dockerfiles/Dockerfile.n8n` und aktiviere in der Compose-Datei die `build:`-Option (Kommentare zeigen, wie).

Sicherheit & Wartung
--------------------
- Diese Composes sollen *sicher* und *inaktiv* bleiben, bis du sie bewusst beim Start mit angibst.
- Änderungen an den main-compose-Dateien sollten **nicht** automatisch n8n hinzufügen; n8n bleibt modular.

Beispiel (Start nur n8n zusammen mit Proxmox-Stack):

  docker compose -f docker-compose.yml -f tools/ansible-controller/safe-docker/6-docker-compose.n8n.yml up -d

Wenn du möchtest, lege ich noch weitere modulare Compose-Fragmente (z. B. n8n+db) an oder schreibe ein kurzes Shell-Skript `safe-up.sh`, das standardisierte Starts mit `-f` erleichtert.