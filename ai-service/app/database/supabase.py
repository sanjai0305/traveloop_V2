"""
supabase.py (Deprecated - Bridges to MySQL)
Retained as a compatibility shim. All operations redirect to MySQL.
"""
from app.database.mysql import init_mysql, check_mysql_health, get_engine

def init_supabase():
    return init_mysql()

def get_supabase():
    return init_mysql()

def check_supabase_health():
    return check_mysql_health()
