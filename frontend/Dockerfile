# Wir gehen zurück auf Alpine (klein, schnell und wir können System-Pakete nutzen)
FROM node:20-alpine

WORKDIR /app

# TRICK 17: Wir installieren esbuild direkt über das Betriebssystem!
# Das umgeht den blockierten "spawn sh" Befehl von npm komplett.
RUN apk add --no-cache esbuild

# WICHTIG: Wir sagen dem System: "Nimm das esbuild, das wir gerade installiert haben!"
ENV ESBUILD_BINARY_PATH=/usr/bin/esbuild

COPY package*.json ./

# Wir installieren die JS-Pakete, aber VERBIETEN alle Skripte.
# Da wir esbuild schon haben, brauchen wir die Skripte nicht!
RUN npm install --ignore-scripts

COPY . .

# Jetzt bauen (Vite nutzt jetzt automatisch das System-Esbuild)
RUN npm run build

# --- Nginx Server ---
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
