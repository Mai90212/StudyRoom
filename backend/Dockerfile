# Backend Dockerfile - FastAPI + bedrock-py
# 多阶段构建: builder → production

# ============================================================
# STAGE 1: Builder - 安装依赖
# ============================================================
FROM python:3.12-slim AS builder

WORKDIR /app

# 安装系统依赖 (用于编译某些 Python 包)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY pyproject.toml uv.lock ./

# 安装 uv 包管理器
RUN pip install --no-cache-dir uv

# 安装生产依赖
RUN uv sync --frozen --no-dev --no-install-project

# ============================================================
# STAGE 2: Production - 运行时镜像
# ============================================================
FROM python:3.12-slim AS production

WORKDIR /app

# 安装运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 从 builder 阶段复制已安装的包
COPY --from=builder /app/.venv /app/.venv

# 复制源代码
COPY . .

# 设置环境变量
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src:$PYTHONPATH"

# 创建非 root 用户
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser \
    && chown -R appuser:appuser /app

USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
