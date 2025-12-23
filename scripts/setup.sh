#!/bin/bash
# AI Arena - Setup Script
# Führt die komplette Installation und Konfiguration durch

set -e

echo "🏛️ AI Arena Setup Script"
echo "========================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktion für Statusmeldungen
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Prüfe Voraussetzungen
check_requirements() {
    info "Prüfe Voraussetzungen..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        error "Docker ist nicht installiert. Bitte installiere Docker: https://docs.docker.com/get-docker/"
    fi
    success "Docker gefunden"
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose ist nicht installiert. Bitte installiere Docker Compose."
    fi
    success "Docker Compose gefunden"
    
    # Node.js (optional, für lokale Entwicklung)
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        success "Node.js gefunden: $NODE_VERSION"
    else
        warning "Node.js nicht gefunden (optional für lokale Entwicklung)"
    fi
    
    echo ""
}

# Erstelle .env Datei
setup_env() {
    info "Konfiguriere Umgebungsvariablen..."
    
    if [ -f .env ]; then
        warning ".env Datei existiert bereits. Überspringe..."
        return
    fi
    
    cp .env.example .env
    
    # Generiere sichere Secrets
    JWT_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9')
    REDIS_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9')
    MINIO_SECRET=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9')
    
    # Aktualisiere .env
    sed -i "s/your_super_secure_jwt_secret_at_least_32_characters/$JWT_SECRET/" .env
    sed -i "s/your_encryption_key_at_least_32_characters/$ENCRYPTION_KEY/" .env
    sed -i "s/arena_secure_password/$DB_PASSWORD/" .env
    sed -i "s/redis_secure_password/$REDIS_PASSWORD/" .env
    sed -i "s/minio_secret_key/$MINIO_SECRET/" .env
    
    warning "WICHTIG: Bitte füge deine API-Keys in .env ein:"
    echo "  - OPENROUTER_API_KEY"
    echo "  - OPENAI_API_KEY"
    echo ""
    
    success ".env Datei erstellt"
}

# Installiere Dependencies
install_dependencies() {
    info "Installiere Dependencies..."
    
    # Backend
    if [ -d "backend" ]; then
        cd backend
        if [ -f "package.json" ]; then
            npm install
            success "Backend Dependencies installiert"
        fi
        cd ..
    fi
    
    # Frontend
    if [ -d "frontend" ]; then
        cd frontend
        if [ -f "package.json" ]; then
            npm install
            success "Frontend Dependencies installiert"
        fi
        cd ..
    fi
}

# Starte Docker Container
start_docker() {
    info "Starte Docker Container..."
    
    # Starte Infrastruktur (DB, Redis, MinIO)
    docker compose up -d postgres redis minio
    
    # Warte auf Services
    info "Warte auf Datenbankverbindung..."
    sleep 10
    
    success "Docker Container gestartet"
}

# Initialisiere Datenbank
init_database() {
    info "Initialisiere Datenbank..."
    
    cd backend
    
    # Generiere Prisma Client
    npx prisma generate
    
    # Führe Migrationen aus
    npx prisma db push
    
    # Seed Datenbank (optional)
    # npm run db:seed
    
    cd ..
    
    success "Datenbank initialisiert"
}

# Erstelle MinIO Bucket
init_storage() {
    info "Konfiguriere MinIO Storage..."
    
    # Warte auf MinIO
    sleep 5
    
    # Erstelle Bucket (mit mc CLI oder API)
    docker exec ai-arena-minio mc alias set local http://localhost:9000 minio_access_key minio_secret_key 2>/dev/null || true
    docker exec ai-arena-minio mc mb local/ai-arena --ignore-existing 2>/dev/null || true
    
    success "MinIO Storage konfiguriert"
}

# Hauptfunktion
main() {
    echo "Starte AI Arena Setup..."
    echo ""
    
    check_requirements
    setup_env
    
    # Frage nach API Keys
    echo ""
    read -p "Hast du deine API Keys in .env eingetragen? (j/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        warning "Bitte füge deine API Keys in .env ein und führe das Script erneut aus."
        exit 0
    fi
    
    start_docker
    install_dependencies
    init_database
    init_storage
    
    echo ""
    echo "=========================================="
    success "🎉 AI Arena Setup abgeschlossen!"
    echo "=========================================="
    echo ""
    echo "Nächste Schritte:"
    echo "  1. Starte Backend:  cd backend && npm run dev"
    echo "  2. Starte Frontend: cd frontend && npm run dev"
    echo ""
    echo "Oder mit Docker:"
    echo "  docker compose up -d"
    echo ""
    echo "URLs:"
    echo "  - Frontend:    http://localhost:3000"
    echo "  - Backend API: http://localhost:3001"
    echo "  - MinIO UI:    http://localhost:9001"
    echo ""
}

# Führe Hauptfunktion aus
main "$@"
