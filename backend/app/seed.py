"""
🌱 NOVA v3 Database Seeder
Füllt die Datenbank mit initialen Daten für die 4 Agenten
"""
import asyncio
from sqlalchemy import create_engine, text
from app.config import settings

# Initial agent data
AGENTS = [
    {
        "id": "core",
        "name": "CORE",
        "emoji": "🧠",
        "role": "Orchestrator",
        "description": "Der Kopf von NOVA v3. Orchestriert alle anderen Agenten und trifft zentrale Entscheidungen.",
        "capabilities": ["routing", "decision_making", "coordination", "task_distribution"],
        "enabled": True,
    },
    {
        "id": "forge",
        "name": "FORGE",
        "emoji": "⚒️",
        "role": "Development & Deployment",
        "description": "Zuständig für Code-Entwicklung, Builds und Deployments. Nutzt wizzad.sh für Infrastruktur-Deployments.",
        "capabilities": ["coding", "building", "deployment", "docker", "ansible"],
        "enabled": True,
    },
    {
        "id": "phoenix",
        "name": "PHOENIX",
        "emoji": "🐦‍🔥",
        "role": "DevOps & Self-Healing",
        "description": "Sorgt für Selbstheilung, Backups und Recovery. Kann das System von 0 wiederherstellen.",
        "capabilities": ["self_healing", "backup", "recovery", "monitoring", "automation"],
        "enabled": True,
    },
    {
        "id": "guardian",
        "name": "GUARDIAN",
        "emoji": "🛡️",
        "role": "Monitoring & Security",
        "description": "Überwacht System-Ressourcen, führt Security-Scans durch und verhindert Überlastung.",
        "capabilities": ["monitoring", "security", "resource_management", "cve_scanning", "alerting"],
        "enabled": True,
    },
]


def seed_database():
    """Seeds the database with initial data"""
    print("🌱 Starting database seeding...")
    
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Create agents table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS agents (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                emoji VARCHAR(10),
                role VARCHAR(100),
                description TEXT,
                capabilities JSONB,
                enabled BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        # Insert agents
        for agent in AGENTS:
            # Check if agent exists
            result = conn.execute(
                text("SELECT id FROM agents WHERE id = :id"),
                {"id": agent["id"]}
            )
            
            if result.fetchone() is None:
                # Insert new agent
                conn.execute(
                    text("""
                        INSERT INTO agents (id, name, emoji, role, description, capabilities, enabled)
                        VALUES (:id, :name, :emoji, :role, :description, :capabilities::jsonb, :enabled)
                    """),
                    {
                        "id": agent["id"],
                        "name": agent["name"],
                        "emoji": agent["emoji"],
                        "role": agent["role"],
                        "description": agent["description"],
                        "capabilities": str(agent["capabilities"]).replace("'", '"'),
                        "enabled": agent["enabled"],
                    }
                )
                print(f"✓ Created agent: {agent['name']} ({agent['emoji']})")
            else:
                print(f"⚠ Agent already exists: {agent['name']}")
        
        conn.commit()
        
        # Create tasks table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tasks (
                task_id VARCHAR(100) PRIMARY KEY,
                agent_id VARCHAR(50) REFERENCES agents(id),
                action VARCHAR(100) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                payload JSONB,
                result JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """))
        conn.commit()
        
        print("✓ Database tables created")
    
    print("🎉 Database seeding completed!")


if __name__ == "__main__":
    seed_database()
