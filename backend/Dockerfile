FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 生成 Prisma 客戶端
RUN npx prisma generate

# 創建日誌目錄
RUN mkdir -p logs

# 創建上傳目錄
RUN mkdir -p uploads

# 暴露端口
EXPOSE 5000

# 啟動應用
CMD ["npm", "start"]
