import logging
import ssl
import os
import json
from typing import Any, List, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_engine = None
_SessionFactory = None


def init_mysql():
    global _engine, _SessionFactory
    if _engine is not None:
        return _engine

    settings = get_settings()
    host = settings.db_host
    port = settings.db_port
    user = settings.db_user
    password = settings.db_password
    database = settings.db_name

    connection_url = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"

    connect_args = {}
    if settings.db_ssl:
        ca_path = os.getenv("DB_SSL_CA_PATH", "/home/ubuntu/global-bundle.pem")
        if not os.path.isfile(ca_path):
            raise FileNotFoundError(f"RDS CA certificate not found: {ca_path}")
        ssl_context = ssl.create_default_context(cafile=ca_path)
        ssl_context.check_hostname = True
        ssl_context.verify_mode = ssl.CERT_REQUIRED
        connect_args["ssl"] = ssl_context

    logger.info(f"[MySQL Init] Connecting to {user}@{host}:{port}/{database}...")
    _engine = create_engine(
        connection_url,
        pool_size=10,
        max_overflow=5,
        pool_recycle=3600,
        pool_pre_ping=True,
        connect_args=connect_args,
    )
    _SessionFactory = sessionmaker(bind=_engine, autocommit=False, autoflush=False)
    logger.info("✅ MySQL SQLAlchemy Engine Initialized")
    return _engine


def get_engine():
    global _engine
    if _engine is None:
        return init_mysql()
    return _engine


def get_session() -> Session:
    global _SessionFactory
    if _SessionFactory is None:
        init_mysql()
    return _SessionFactory()


def check_mysql_health() -> bool:
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning(f"MySQL health check notice: {exc}")
        return False


def fetch_all(sql: str, params: Optional[dict[str, Any]] = None) -> List[dict[str, Any]]:
    engine = get_engine()
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        rows = [dict(row._mapping) for row in result]
        return rows


def fetch_one(sql: str, params: Optional[dict[str, Any]] = None) -> Optional[dict[str, Any]]:
    engine = get_engine()
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        first = result.first()
        return dict(first._mapping) if first else None


def execute_statement(sql: str, params: Optional[dict[str, Any]] = None) -> int:
    engine = get_engine()
    with engine.connect() as conn:
        res = conn.execute(text(sql), params or {})
        conn.commit()
        return res.rowcount
