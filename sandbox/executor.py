import sqlite3
import os
from django.conf import settings

# Répertoire de stockage des bases SQLite par salon
SANDBOX_DB_DIR = os.path.join(settings.BASE_DIR, 'sandbox_databases')
os.makedirs(SANDBOX_DB_DIR, exist_ok=True)

ROOM_DATABASES = {}

def get_room_db(room_name: str) -> sqlite3.Connection:
    if room_name not in ROOM_DATABASES:
        # Chemin du fichier de DB spécifique au salon
        db_path = os.path.join(SANDBOX_DB_DIR, f"{room_name}.sqlite3")
        is_new_db = not os.path.exists(db_path)

        conn = sqlite3.connect(db_path, check_same_thread=False)
        cursor = conn.cursor()

        # Si c'est une nouvelle base, on initialise la table de démonstration
        if is_new_db:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS etudiants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nom TEXT NOT NULL,
                    filiere TEXT NOT NULL,
                    note REAL
                );
            """)
            cursor.executemany("""
                INSERT INTO etudiants (nom, filiere, note) VALUES (?, ?, ?);
            """, [
                ('Alice', 'Génie Logiciel', 16.5),
                ('Bob', 'Réseaux & Sécurité', 14.0),
                ('Charlie', 'Génie Logiciel', 18.0)
            ])
            conn.commit()

        ROOM_DATABASES[room_name] = conn

    return ROOM_DATABASES[room_name]


def execute_sql_query(room_name: str, sql_code: str) -> dict:
    conn = get_room_db(room_name)
    cursor = conn.cursor()

    # Nettoyage et découpage des requêtes
    # Supprime les commentaires et découpe par point-virgule
    cleaned_code = "\n".join([line for line in sql_code.splitlines() if not line.strip().startswith('--')])
    statements = [stmt.strip() for stmt in cleaned_code.split(';') if stmt.strip()]

    if not statements:
        return {"success": False, "error": "Aucune requête SQL valide détectée."}

    try:
        # 1. Exécution de toutes les requêtes précédentes s'il y en a plusieurs (ex: CREATE, INSERT)
        for stmt in statements[:-1]:
            cursor.execute(stmt)

        # 2. Exécution de la DERNIÈRE requête avec cursor.execute()
        last_stmt = statements[-1]
        cursor.execute(last_stmt)

        # 3. Vérification si la dernière instruction est une requête de sélection (SELECT / PRAGMA)
        if cursor.description is not None:
            columns = [column[0] for column in cursor.description]
            rows = cursor.fetchall()
            
            # Conversion des données en types Python standard (au cas où il y a des types complexes)
            formatted_rows = [list(row) for row in rows]

            return {
                "success": True,
                "type": "select",
                "columns": columns,
                "rows": formatted_rows,
                "row_count": len(formatted_rows)
            }
        else:
            # Pour les mutations (INSERT, UPDATE, DELETE, CREATE, etc.)
            conn.commit()
            return {
                "success": True,
                "type": "mutation",
                "message": "Requête exécutée avec succès.",
                "rows_affected": cursor.rowcount if cursor.rowcount != -1 else 0
            }

    except sqlite3.Error as e:
        return {
            "success": False,
            "error": str(e)
        }