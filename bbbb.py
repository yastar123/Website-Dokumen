import sqlite3
import os
from cryptography.fernet import Fernet
import base64

# Path ke database pgAdmin
db_path = os.path.expanduser(r'~\AppData\Roaming\pgadmin\pgadmin4.db')

# Buka database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Query untuk mendapatkan server info
cursor.execute("SELECT name, host, username, password FROM server")
servers = cursor.fetchall()

for server in servers:
    print(f"Server: {server[0]}")
    print(f"Host: {server[1]}")
    print(f"Username: {server[2]}")
    print(f"Password (encrypted): {server[3]}")
    print("-" * 30)

conn.close()