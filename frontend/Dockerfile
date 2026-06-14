# Frontend Dockerfile - Vue 3 + Vite + Nginx
# 多阶段构建: build → production

# ============================================================
# STAGE 1: Build - 编译前端资源
# ============================================================
FROM node:22-alpine AS build

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# ============================================================
# STAGE 2: Production - Nginx 服务
# ============================================================
FROM nginx:1.27-alpine AS production

# 删除默认配置
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从 build 阶段复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
