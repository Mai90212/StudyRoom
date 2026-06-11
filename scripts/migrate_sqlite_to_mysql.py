#!/usr/bin/env python3
"""
SQLite → MySQL 数据迁移脚本

使用方法:
    python scripts/migrate_sqlite_to_mysql.py

前置条件:
    1. MySQL 服务已启动
    2. .env 文件中已配置 MySQL 连接信息
    3. MySQL 数据库已初始化 (运行 mysql/initdb/01-schema.sql)
"""

import os
import sqlite3
import sys
from pathlib import Path

import pymysql

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "backend" / "src"))


def load_env():
    """加载 .env 文件"""
    env_path = project_root / "backend" / ".env"
    if not env_path.exists():
        print(f"错误: .env 文件不存在: {env_path}")
        sys.exit(1)

    env_vars = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                env_vars[key.strip()] = value.strip()
    return env_vars


def get_sqlite_connection():
    """获取 SQLite 连接"""
    db_path = project_root / "backend" / "studyroom.db"
    if not db_path.exists():
        print(f"错误: SQLite 数据库不存在: {db_path}")
        sys.exit(1)
    return sqlite3.connect(str(db_path))


def get_mysql_connection(env_vars):
    """获取 MySQL 连接"""
    return pymysql.connect(
        host=env_vars.get("DATABASE_HOST", "localhost"),
        port=int(env_vars.get("DATABASE_PORT", 3306)),
        user=env_vars.get("DATABASE_USERNAME", "studyroom"),
        password=env_vars.get("DATABASE_PASSWORD", ""),
        database=env_vars.get("DATABASE_SCHEMA", "studyroom"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def migrate_table(sqlite_conn, mysql_conn, table_name, columns):
    """迁移单个表的数据"""
    sqlite_cursor = sqlite_conn.cursor()
    mysql_cursor = mysql_conn.cursor()

    # 查询 SQLite 数据
    sqlite_cursor.execute(f"SELECT {', '.join(columns)} FROM {table_name}")
    rows = sqlite_cursor.fetchall()

    if not rows:
        print(f"  表 {table_name}: 无数据")
        return 0

    # 构建 INSERT 语句
    placeholders = ", ".join(["%s"] * len(columns))
    columns_str = ", ".join(columns)
    insert_sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"

    # 批量插入
    migrated = 0
    for row in rows:
        try:
            mysql_cursor.execute(insert_sql, row)
            migrated += 1
        except pymysql.err.IntegrityError as e:
            if "Duplicate entry" in str(e):
                print(f"  警告: 跳过重复记录: {e}")
            else:
                raise

    mysql_conn.commit()
    print(f"  表 {table_name}: 迁移 {migrated}/{len(rows)} 条记录")
    return migrated


def main():
    print("=" * 60)
    print("StudyRoom 数据迁移: SQLite → MySQL")
    print("=" * 60)

    # 加载环境变量
    env_vars = load_env()
    print(f"\nMySQL 配置:")
    print(f"  主机: {env_vars.get('DATABASE_HOST', 'localhost')}")
    print(f"  端口: {env_vars.get('DATABASE_PORT', '3306')}")
    print(f"  数据库: {env_vars.get('DATABASE_SCHEMA', 'studyroom')}")

    # 连接数据库
    print("\n连接数据库...")
    try:
        sqlite_conn = get_sqlite_connection()
        print("  ✓ SQLite 连接成功")
    except Exception as e:
        print(f"  ✗ SQLite 连接失败: {e}")
        sys.exit(1)

    try:
        mysql_conn = get_mysql_connection(env_vars)
        print("  ✓ MySQL 连接成功")
    except Exception as e:
        print(f"  ✗ MySQL 连接失败: {e}")
        print("\n请确保:")
        print("  1. MySQL 服务已启动")
        print("  2. .env 文件中的数据库配置正确")
        print("  3. 数据库已初始化 (运行 mysql/initdb/01-schema.sql)")
        sys.exit(1)

    # 定义表结构 (表名, 列名列表)
    tables = [
        ("users", ["id", "email", "nickname", "password_hash", "is_verified", "created_at"]),
        ("verification_codes", ["id", "email", "code", "expires_at", "is_used"]),
        ("rooms", ["id", "name", "invite_code", "max_members", "owner_id", "is_active", "created_at"]),
        ("room_members", ["id", "room_id", "user_id", "status", "joined_at", "last_heartbeat"]),
        ("focus_records", ["id", "user_id", "room_id", "duration", "date", "created_at"]),
        ("focus_hourly_records", ["id", "user_id", "room_id", "hour_start", "duration_seconds", "date", "created_at"]),
        ("focus_sessions", ["id", "user_id", "room_id", "start_time", "end_time", "total_seconds", "away_seconds", "away_count", "created_at"]),
        ("user_follows", ["id", "follower_id", "following_id", "created_at"]),
        ("user_settings", ["id", "user_id", "daily_goal_minutes", "streak_goal_minutes", "created_at", "updated_at"]),
    ]

    # 迁移数据
    print("\n开始迁移数据...")
    total_migrated = 0
    for table_name, columns in tables:
        try:
            migrated = migrate_table(sqlite_conn, mysql_conn, table_name, columns)
            total_migrated += migrated
        except Exception as e:
            print(f"  ✗ 表 {table_name} 迁移失败: {e}")
            mysql_conn.rollback()
            continue

    # 关闭连接
    sqlite_conn.close()
    mysql_conn.close()

    print("\n" + "=" * 60)
    print(f"迁移完成! 共迁移 {total_migrated} 条记录")
    print("=" * 60)


if __name__ == "__main__":
    main()
