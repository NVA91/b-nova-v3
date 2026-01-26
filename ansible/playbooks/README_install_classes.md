# NOVA v3 - Installation Classes
Flexible Steuerung deiner Ansible-Installation mit modularen Klassen.

## 🔁 Vollständige Installation (Infra + Apps + Tests)
ansible-playbook playbooks/install_classes.yml

## 🛠️ Nur Core-Infrastruktur
ansible-playbook playbooks/install_classes.yml -e "do_infra=true do_apps=false do_test=false"

## 🚀 Nur Applikationen
ansible-playbook playbooks/install_classes.yml -e "do_infra=false do_apps=true do_test=false"

## 🧪 Nur Tests & Wartung
ansible-playbook playbooks/install_classes.yml -e "do_infra=false do_apps=false do_test=true"

## ⚙️ Infra + Apps (ohne Tests)
ansible-playbook playbooks/install_classes.yml -e "do_test=false"

## 📋 Flags
- `do_infra`: Core-Infrastruktur aktivieren (Standard: true)
- `do_apps`: Applikationen aktivieren (Standard: true)
- `do_test`: Tests & Wartung aktivieren (Standard: false)

## 📁 Struktur
- `playbooks/install_classes.yml`: Hauptsteuerung
- `playbooks/install_infra.yml`: Infrastruktur-Deployment
- `playbooks/install_apps.yml`: Applikationen-Deployment
- `playbooks/install_tests.yml`: Tests & Wartung
- `tasks/`: Modulare Task-Dateien