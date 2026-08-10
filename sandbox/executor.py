import os
import psycopg2
from django.db import connection
from django.conf import settings

def get_schema_name(room_name: str) -> str:
    """Génère un nom de schéma PostgreSQL valide à partir de l'identifiant du salon."""
    sanitized = str(room_name).replace('-', '_').lower()
    return f"schema_{sanitized}"

def ensure_schema_initialized(cursor, schema_name: str):
    """Crée le schéma s'il n'existe pas et initialise la table d'exemple `etudiants`."""
    # 1. Création du schéma s'il n'existe pas
    cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}";')
    
    # 2. Positionnement du search_path sur ce schéma
    cursor.execute(f'SET search_path TO "{schema_name}", public;')
    
    # 3. Vérification si la table `etudiants` existe dans ce schéma
    cursor.execute(f"""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = '{schema_name}' AND table_name = 'etudiants'
        );
    """)
    table_exists = cursor.fetchone()[0]

    if not table_exists:
        # Initialisation de la table et des données de démonstration dans le schéma du salon
        cursor.execute("""
            CREATE TABLE etudiants (
                id SERIAL PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                filiere VARCHAR(100) NOT NULL,
                note NUMERIC(4, 2)
            );
        """)
        cursor.execute("""
            INSERT INTO etudiants (nom, filiere, note) VALUES
            ('Alice', 'Génie Logiciel', 16.5),
            ('Bob', 'Réseaux & Sécurité', 14.0),
            ('Charlie', 'Génie Logiciel', 18.0);
        """)

def execute_sql_query(room_name: str, sql_code: str) -> dict:
    """Exécute des requêtes SQL dans le schéma PostgreSQL isolé du salon."""
    schema_name = get_schema_name(room_name)

    # Nettoyage et découpage des requêtes
    cleaned_code = "\n".join([line for line in sql_code.splitlines() if not line.strip().startswith('--')])
    statements = [stmt.strip() for stmt in cleaned_code.split(';') if stmt.strip()]

    if not statements:
        return {"success": False, "error": "Aucune requête SQL valide détectée."}

    try:
        with connection.cursor() as cursor:
            # S'assurer que le schéma est prêt et sélectionné
            ensure_schema_initialized(cursor, schema_name)

            # 1. Exécution de toutes les requêtes précédant la dernière (ex: CREATE, INSERT)
            for stmt in statements[:-1]:
                cursor.execute(stmt)

            # 2. Exécution de la DERNIÈRE requête
            last_stmt = statements[-1]
            cursor.execute(last_stmt)

            # 3. Vérification si la dernière instruction retourne des résultats (SELECT, EXPLAIN, etc.)
            if cursor.description is not None:
                columns = [column[0] for column in cursor.description]
                rows = cursor.fetchall()
                
                # Formatage propre des types (Decimal, datetime, etc. vers types JSON-serializable)
                formatted_rows = []
                for row in rows:
                    formatted_row = []
                    for item in row:
                        if item is None:
                            formatted_row.append(None)
                        elif isinstance(item, (int, float, str, bool)):
                            formatted_row.append(item)
                        else:
                            formatted_row.append(str(item))
                    formatted_rows.append(formatted_row)

                return {
                    "success": True,
                    "type": "select",
                    "columns": columns,
                    "rows": formatted_rows,
                    "row_count": len(formatted_rows)
                }
            else:
                return {
                    "success": True,
                    "type": "mutation",
                    "message": "Requête exécutée avec succès dans le schéma PostgreSQL.",
                    "rows_affected": cursor.rowcount if cursor.rowcount != -1 else 0
                }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }