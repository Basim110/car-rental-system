import oracledb

# Replace with your actual credentials
try:
    conn = oracledb.connect(user="system", password="yourpassword", dsn="localhost:1521/xe")
    print("Successfully connected to Oracle Database!")
except Exception as e:
    print("Connection failed:", e)