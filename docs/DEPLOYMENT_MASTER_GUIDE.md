# DEPLOYMENT MASTER GUIDE: NOVA v3 auf Mini-PC

**Zielplattform:** AMD Mini-PC (Ryzen 7 H255, 32 GB RAM, 3x NVMe)  
**GPU:** RTX 5060 Ti (via OCuLink eGPU) - optional in Phase 2  
**Deployment-Strategie:** Zweiphasig, sicher, ohne Systemgefährdung

---

## Übersicht

Dieses Deployment folgt einem zweiphasigen Ansatz, der maximale Sicherheit gewährleistet:

1. **Phase 1:** Basis-Deployment ohne GPU → Stabiles, funktionsfähiges System
2. **Phase 2:** GPU-Erweiterung → Nachträgliche, isolierte Aktivierung der RTX 5060 Ti

Dieser Ansatz stellt sicher, dass das Basis-System zu keinem Zeitpunkt durch GPU-Konfigurationsfehler beeinträchtigt wird. Die GPU wird erst aktiviert, wenn das System bereits stabil läuft.

---

## Dokumenten-Struktur

| Dokument | Zweck | Wann verwenden? |
|----------|-------|-----------------|
| `DEPLOYMENT_GUIDE_PHASE1.md` | Schritt-für-Schritt-Anleitung für das Basis-Deployment ohne GPU. | Vor dem ersten Deployment. |
| `DEPLOYMENT_GUIDE_PHASE2.md` | Schritt-für-Schritt-Anleitung für die sichere GPU-Erweiterung. | Nachdem Phase 1 erfolgreich abgeschlossen und das System stabil ist. |
| `PRE_FLIGHT_CHECKLIST.md` | Checkliste zur Vorbereitung und Validierung vor/nach dem Deployment. | Vor jedem Deployment und nach Abschluss jeder Phase. |
| `ROLLBACK_AND_TROUBLESHOOTING.md` | Anleitungen zum Zurücksetzen von Änderungen und zur Fehlerbehebung. | Bei Problemen oder wenn ein Rollback erforderlich ist. |

---

## Deployment-Ablauf

### Vorbereitung

1. Lesen Sie alle Dokumente vollständig durch, bevor Sie mit dem Deployment beginnen.
2. Arbeiten Sie die `PRE_FLIGHT_CHECKLIST.md` ab, um sicherzustellen, dass Ihr System bereit ist.
3. Erstellen Sie ein Backup Ihrer aktuellen Proxmox-Konfiguration (falls vorhanden).

### Phase 1: Basis-Deployment (ohne GPU)

1. Folgen Sie der `DEPLOYMENT_GUIDE_PHASE1.md` Schritt für Schritt.
2. Verwenden Sie das Hardware-Profil `pve01_nogpu.yml`, das die GPU explizit deaktiviert.
3. Nach Abschluss: Validieren Sie das System mit der `PRE_FLIGHT_CHECKLIST.md` (Abschnitt "Validierung nach Phase 1").
4. Lassen Sie das System für mindestens 24 Stunden laufen, um die Stabilität zu gewährleisten.

### Phase 2: GPU-Erweiterung (optional)

1. Stellen Sie sicher, dass die eGPU (RTX 5060 Ti) korrekt mit dem Mini-PC verbunden ist.
2. Folgen Sie der `DEPLOYMENT_GUIDE_PHASE2.md` Schritt für Schritt.
3. Wechseln Sie das Hardware-Profil auf `pve01.yml` (mit GPU-Konfiguration).
4. Nach Abschluss: Validieren Sie die GPU-Integration mit der `PRE_FLIGHT_CHECKLIST.md` (Abschnitt "Validierung nach Phase 2").

### Troubleshooting

- Bei Problemen konsultieren Sie die `ROLLBACK_AND_TROUBLESHOOTING.md`.
- Nutzen Sie die Rollback-Strategie, um Änderungen sicher rückgängig zu machen.

---

## Sicherheitshinweise

- **Niemals Standardpasswörter verwenden.** Alle `changeme`-Werte in `host_vars/pve01.yml` müssen durch sichere, eindeutige Passwörter ersetzt werden.
- **Immer den `--check`-Modus von Ansible verwenden,** bevor Sie Änderungen anwenden.
- **Backups erstellen,** bevor Sie kritische Änderungen vornehmen (insbesondere vor Phase 2).
- **Geduld haben.** Lassen Sie das System nach Phase 1 stabil laufen, bevor Sie die GPU hinzufügen.

---

## Schnellreferenz

### Wichtige Dateien

```
ansible/inventory/hardware/pve01.yml          # Hardware-Profil (Phase 1: ohne GPU)
ansible/inventory/host_vars/pve01.yml         # Host-spezifische Konfiguration
ansible/site.yml                              # Haupt-Deployment-Playbook
ansible/playbooks/extended_services.yml       # Erweiterte Dienste (N8N, Monitoring)
```

### Wichtige Kommandos

```bash
# Phase 1: Basis-Deployment
ansible-playbook -i inventory/production/ site.yml --check
ansible-playbook -i inventory/production/ site.yml

# Erweiterte Dienste (nach Phase 1)
ansible-playbook -i inventory/production/ playbooks/extended_services.yml --check
ansible-playbook -i inventory/production/ playbooks/extended_services.yml

# Validierung
ansible -i inventory/production/ pve01 -m setup
```

### Support

Bei Fragen oder Problemen:
1. Konsultieren Sie die entsprechenden Guide-Dokumente
2. Prüfen Sie die Ansible-Logs in `/var/log/ansible/`
3. Nutzen Sie den `--check` und `--diff` Modus für Debugging