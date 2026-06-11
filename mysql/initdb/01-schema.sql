-- StudyRoom MySQL 初始化脚本
-- 此脚本在 MySQL 容器首次启动时自动执行

-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS studyroom
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE studyroom;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '邮箱',
    nickname VARCHAR(50) NOT NULL COMMENT '昵称',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT '邮箱是否已验证',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 邮箱验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL COMMENT '目标邮箱',
    code VARCHAR(6) NOT NULL COMMENT '6位验证码',
    expires_at DATETIME NOT NULL COMMENT '过期时间',
    is_used BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已使用',
    INDEX idx_email_code (email, code),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表';

-- 自习室房间表
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '房间名称',
    invite_code VARCHAR(6) NOT NULL UNIQUE COMMENT '6位邀请码',
    max_members INT NOT NULL DEFAULT 20 COMMENT '人数上限',
    owner_id INT NOT NULL COMMENT '房主用户ID',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '房间是否活跃',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_invite_code (invite_code),
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自习室房间表';

-- 自习室成员表
CREATE TABLE IF NOT EXISTS room_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL COMMENT '所属房间ID',
    user_id INT NOT NULL COMMENT '用户ID',
    status VARCHAR(20) NOT NULL DEFAULT 'focusing' COMMENT '当前状态: focusing/away/offline',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    last_heartbeat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后心跳时间',
    INDEX idx_room (room_id),
    INDEX idx_user (user_id),
    INDEX idx_room_user (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自习室成员表';

-- 专注记录表
CREATE TABLE IF NOT EXISTS focus_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    room_id INT NOT NULL COMMENT '房间ID',
    duration INT NOT NULL DEFAULT 0 COMMENT '专注分钟数',
    date DATE NOT NULL COMMENT '记录日期',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '首次记录时间',
    UNIQUE KEY uq_user_room_date (user_id, room_id, date),
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专注记录表';

-- 小时专注记录表
CREATE TABLE IF NOT EXISTS focus_hourly_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    room_id INT NOT NULL COMMENT '房间ID',
    hour_start DATETIME NOT NULL COMMENT '小时开始时间',
    duration_seconds INT NOT NULL DEFAULT 0 COMMENT '该小时专注秒数',
    date DATE NOT NULL COMMENT '记录日期',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    UNIQUE KEY uq_user_room_hour (user_id, room_id, hour_start),
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小时专注记录表';

-- 专注会话表
CREATE TABLE IF NOT EXISTS focus_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    room_id INT NOT NULL COMMENT '房间ID',
    start_time DATETIME NOT NULL COMMENT '进入房间时间',
    end_time DATETIME NULL COMMENT '离开房间时间',
    total_seconds INT NOT NULL DEFAULT 0 COMMENT '总专注秒数',
    away_seconds INT NOT NULL DEFAULT 0 COMMENT '离开（摸鱼）秒数',
    away_count INT NOT NULL DEFAULT 0 COMMENT '切屏/离开次数',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    INDEX idx_user (user_id),
    INDEX idx_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专注会话表';

-- 关注关系表
CREATE TABLE IF NOT EXISTS user_follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL COMMENT '关注者user_id',
    following_id INT NOT NULL COMMENT '被关注者user_id',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
    UNIQUE KEY uq_follower_following (follower_id, following_id),
    INDEX idx_following (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注关系表';

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT '用户ID',
    daily_goal_minutes INT NOT NULL DEFAULT 120 COMMENT '每日目标（分钟）',
    streak_goal_minutes INT NOT NULL DEFAULT 30 COMMENT '连胜最低要求（分钟）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';
