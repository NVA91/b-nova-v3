# 🎯 NOVA v3 Ansible Playbooks

Ansible-Playbooks und Rollen für NOVA v3 Infrastruktur-Automation.

---

## 📋 Verfügbare Playbooks

### 1. Samba Server

**Playbook:** `playbooks/samba.yml`  
**Rolle:** `roles/samba/`

Installiert und konfiguriert einen Samba-Server für Netzwerk-Shares.

**Features:**
- ✅ Samba-Installation
- ✅ Share-Konfiguration
- ✅ Benutzer-Verwaltung
- ✅ Firewall-Konfiguration

**Verwendung:**

```bash
# Inventory anpassen
vim inventory/hosts.yml

# Playbook ausführen
ansible-playbook -i inventory/hosts.yml playbooks/samba.yml

# Mit Passwort-Variablen
ansible-playbook -i inventory/hosts.yml playbooks/samba.yml \
  -e "samba_nova_password=secure_password" \
  -e "samba_admin_password=secure_password"
```

**Konfiguration:**

```yaml
samba_shares:
  - name: "my-share"
    path: "/data/my-share"
    comment: "My Custom Share"
    browseable: "yes"
    writable: "yes"
    guest_ok: "no"
    valid_users: "user1,user2"
```

---

### 2. YubiKey 2FA

**Playbook:** `playbooks/yubikey.yml`  
**Rolle:** `roles/yubikey/`

Konfiguriert YubiKey 5C Nano für 2-Faktor-Authentifizierung.

**Features:**
- ✅ YubiKey-Software-Installation
- ✅ PAM-Integration
- ✅ SSH-Authentifizierung
- ✅ U2F-Support
- ✅ Sudo-2FA

**Verwendung:**

```bash
# 1. YubiKey API-Credentials holen
# https://upgrade.yubico.com/getapikey/

# 2. YubiKey ID ermitteln
# Öffne einen Texteditor und drücke YubiKey-Button
# Kopiere die ersten 12 Zeichen (z.B. cccccccccccc)

# 3. Playbook ausführen
ansible-playbook -i inventory/hosts.yml playbooks/yubikey.yml \
  -e "vault_yubikey_client_id=YOUR_CLIENT_ID" \
  -e "vault_yubikey_secret_key=YOUR_SECRET_KEY"
```

**⚠️ WICHTIG:**
- Teste YubiKey-Authentifizierung bevor du die aktuelle Session schließt!
- Halte eine Backup-SSH-Session offen
- Stelle sicher, dass du physischen Zugriff auf den Server hast

---

## 🚀 Schnellstart

### 1. Inventory konfigurieren

```bash
# Kopiere Beispiel-Inventory
cp inventory/hosts.yml inventory/my-hosts.yml

# Passe Hosts an
vim inventory/my-hosts.yml
```

### 2. Ansible testen

```bash
# Ping alle Hosts
ansible -i inventory/my-hosts.yml all -m ping

# Teste Samba-Server
ansible -i inventory/my-hosts.yml samba_servers -m ping
```

### 3. Playbook ausführen

```bash
# Dry-Run (Check-Mode)
ansible-playbook -i inventory/my-hosts.yml playbooks/samba.yml --check

# Echte Ausführung
ansible-playbook -i inventory/my-hosts.yml playbooks/samba.yml
```

---

## 📁 Struktur

```
ansible/
├── playbooks/           # Ansible Playbooks
│   ├── samba.yml
│   └── yubikey.yml
├── roles/               # Ansible Rollen
│   ├── samba/
│   │   ├── tasks/
│   │   ├── handlers/
│   │   ├── templates/
│   │   └── defaults/
│   └── yubikey/
│       ├── tasks/
│       ├── handlers/
│       ├── templates/
│       └── defaults/
├── inventory/           # Ansible Inventory
│   └── hosts.yml
└── README.md            # Diese Datei
```

---

## 🔧 Tipps

### Ansible Vault für Secrets

```bash
# Secrets verschlüsseln
ansible-vault encrypt_string 'my_secret_password' --name 'samba_nova_password'

# Playbook mit Vault ausführen
ansible-playbook -i inventory/hosts.yml playbooks/samba.yml --ask-vault-pass
```

### Ansible-Konfiguration

Erstelle `ansible.cfg` im Projekt-Root:

```ini
[defaults]
inventory = ansible/inventory/hosts.yml
remote_user = ubuntu
host_key_checking = False
retry_files_enabled = False

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False
```

---

## 📚 Weitere Ressourcen

- [Ansible Documentation](https://docs.ansible.com/)
- [Samba Documentation](https://www.samba.org/samba/docs/)
- [YubiKey Documentation](https://developers.yubico.com/)

---

**Erstellt von:** NOVA v3  
**Datum:** 2026-01-17
