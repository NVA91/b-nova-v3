> # b-nova-v3 AI Service: Erweiterte Test-Suite

Dieses Paket enthält eine umfassende Test-Suite für den b-nova-v3 KI-Service. Sie wurde entwickelt, um die Stabilität, Leistung und Korrektheit des Services unter verschiedenen Bedingungen zu validieren.

## Features der Test-Suite

-   **Startup-Simulation**: Überwacht den Service nach dem Start und wartet, bis der `/health`-Endpunkt einen stabilen Zustand meldet.
-   **Integrationstests**: Eine komplette Suite, die alle API-Endpunkte auf korrekte Funktionalität, Eingabevalidierung und Fehlerbehandlung prüft.
-   **Performance-Benchmarks**: Misst die Latenz und den Durchsatz für einzelne Vorhersagen, um eine Leistungs-Baseline zu erstellen.
-   **Last- und Stresstests**: Simuliert konkurrierende Benutzer, um die Leistung des Services unter Last zu bewerten und Engpässe zu identifizieren.
-   **Health-Monitoring**: Überprüft periodisch den Zustand des Services über einen längeren Zeitraum, um die Stabilität zu gewährleisten.
-   **Master-Test-Runner**: Ein Shell-Skript, das alle Tests in einer logischen Reihenfolge ausführt und eine finale Zusammenfassung liefert.

## Enthaltene Dateien

1.  **`run-all-tests.sh`**: Der **Master-Test-Runner**. Dieses Skript ist der Haupteinstiegspunkt und führt alle anderen Tests aus.
2.  **`test-startup-simulation.js`**: Simuliert den Startprozess und führt ein Health-Polling durch. Kann auch zur Überwachung der Service-Stabilität über Zeit verwendet werden.
3.  **`test-integration.js`**: Eine in sich geschlossene Test-Suite, die die Korrektheit aller API-Endpunkte (`/`, `/health`, `/devices`, `/metrics`, `/predict`, `/predict/batch`) validiert.
4.  **`test-load-performance.js`**: Enthält Skripte zur Durchführung von Performance-Benchmarks, Lasttests mit konkurrierenden Anfragen und Stresstests mit schrittweise ansteigender Last.
5.  **`test-image.jpg`**: Ein Beispielbild, das von den Test-Skripten verwendet wird.

## Verwendung

### Voraussetzungen

-   Node.js (v14 oder neuer)
-   Ein laufender b-nova-v3 AI-Service (standardmäßig auf `http://localhost:8000` erwartet).
-   Eine `test-image.jpg`-Datei im selben Verzeichnis.

### 1. Ausführbar machen

Stelle sicher, dass die Skripte ausführbar sind. Führe diesen Befehl einmalig im Terminal aus:

```bash
chmod +x run-all-tests.sh *.js
```

### 2. Alle Tests ausführen (Empfohlen)

Der einfachste Weg, die gesamte Suite auszuführen, ist der Master-Runner. Er führt alle Tests in der richtigen Reihenfolge aus und gibt am Ende eine Zusammenfassung aus.

```bash
./run-all-tests.sh
```

### 3. Einzelne Test-Suiten ausführen

Du kannst auch jede Test-Suite einzeln ausführen, um spezifische Aspekte des Services zu überprüfen.

#### Startup-Simulation

Wartet, bis der Service bereit ist, und testet dann die Basis-Endpunkte.

```bash
./test-startup-simulation.js startup
```

#### Health-Monitoring

Überwacht den `/health`-Endpunkt für 60 Sekunden alle 5 Sekunden.

```bash
./test-startup-simulation.js monitor 60000 5000
```

#### Integrationstests

Führt eine detaillierte Überprüfung aller Endpunkte und der Fehlerbehandlung durch.

```bash
./test-integration.js
```

#### Performance-Tests

Führt einen schnellen Benchmark für Einzelanfragen und einen Lasttest durch.

```bash
./test-load-performance.js all
```

Oder führe einen spezifischen Lasttest mit 20 konkurrierenden Benutzern und insgesamt 200 Anfragen durch:

```bash
./test-load-performance.js load 20 200
```

#### Stresstest

Führt einen Test mit schrittweise ansteigender Last durch, um die Belastungsgrenzen des Services zu finden.

```bash
./test-load-performance.js stress
```

## Konfiguration

Die Tests können über Umgebungsvariablen konfiguriert werden:

-   `AI_SERVICE_URL`: Die URL des KI-Services (Standard: `http://localhost:8000`).
-   `TEST_IMAGE`: Der Pfad zum Testbild (Standard: `./test-image.jpg`).
-   `CONCURRENT_REQUESTS`: Anzahl der gleichzeitigen Anfragen für den Lasttest (Standard: `10`).
-   `TOTAL_REQUESTS`: Gesamtzahl der Anfragen für den Lasttest (Standard: `100`).

**Beispiel:**

```bash
AI_SERVICE_URL="http://192.168.1.100:8000" ./run-all-tests.sh
```
