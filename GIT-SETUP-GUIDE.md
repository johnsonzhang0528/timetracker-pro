# TimeTracker Pro - Git 設置指南

## 🚀 Git 初始化與分支架構設置

### 步驟 1: 初始化 Git 倉庫
```bash
# 初始化 Git 倉庫
git init

# 設定用戶資訊 (如果還沒設定)
git config user.name "您的姓名"
git config user.email "您的信箱@example.com"

# 設定主分支名稱為 master (如果系統預設為 main)
git branch -M master
```

### 步驟 2: 首次提交
```bash
# 添加所有文件到暫存區
git add .

# 首次提交
git commit -m "feat: 初始化 TimeTracker Pro 專案

- 建立完整的時間追蹤與計費系統
- 實現響應式設計 (RWD)
- 包含專案管理、報表分析、發票生成功能
- 使用 React + Vite + Tailwind CSS 技術棧"
```

### 步驟 3: 建立 QA 分支
```bash
# 建立並切換到 qa 分支
git checkout -b qa

# 推送 qa 分支到遠端 (如果有設定遠端倉庫)
git push -u origin qa

# 切換回 master 分支
git checkout master
```

### 步驟 4: 設定遠端倉庫 (選擇性)

#### GitHub 設置:
```bash
# 添加 GitHub 遠端倉庫
git remote add origin https://github.com/您的用戶名/timetracker-pro.git

# 推送 master 分支
git push -u origin master

# 推送 qa 分支
git push -u origin qa
```

#### GitLab 設置:
```bash
# 添加 GitLab 遠端倉庫
git remote add origin https://gitlab.com/您的用戶名/timetracker-pro.git

# 推送所有分支
git push -u origin --all
```

## 🌿 分支管理策略

### 分支架構:
- **master**: 生產環境分支，穩定版本
- **qa**: 測試環境分支，功能驗證
- **feature/***: 功能開發分支
- **hotfix/***: 緊急修復分支

### 工作流程:

#### 1. 新功能開發:
```bash
# 從 master 建立功能分支
git checkout master
git pull origin master
git checkout -b feature/new-feature-name

# 開發完成後合併到 qa
git checkout qa
git pull origin qa
git merge feature/new-feature-name
git push origin qa

# QA 測試通過後合併到 master
git checkout master
git pull origin master
git merge qa
git push origin master

# 刪除功能分支
git branch -d feature/new-feature-name
git push origin --delete feature/new-feature-name
```

#### 2. 緊急修復:
```bash
# 從 master 建立熱修復分支
git checkout master
git pull origin master
git checkout -b hotfix/urgent-fix-name

# 修復完成後直接合併到 master
git checkout master
git merge hotfix/urgent-fix-name
git push origin master

# 同步到 qa 分支
git checkout qa
git merge master
git push origin qa

# 刪除修復分支
git branch -d hotfix/urgent-fix-name
```

## 📝 提交訊息規範

使用 Conventional Commits 格式:

```
類型(範圍): 簡短描述

詳細描述 (選擇性)

頁腳 (選擇性)
```

### 提交類型:
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文檔更新
- `style`: 程式碼格式 (不影響功能)
- `refactor`: 重構程式碼
- `test`: 測試相關
- `chore`: 建置工具或輔助工具變動

### 範例:
```bash
git commit -m "feat(timer): 新增暫停功能"
git commit -m "fix(invoice): 修復稅額計算錯誤"
git commit -m "docs: 更新 README 安裝說明"
git commit -m "style(components): 統一程式碼縮排格式"
```

## 🔧 實用 Git 指令

### 查看狀態:
```bash
# 查看當前狀態
git status

# 查看分支
git branch -a

# 查看提交歷史
git log --oneline --graph

# 查看遠端倉庫
git remote -v
```

### 分支操作:
```bash
# 切換分支
git checkout qa

# 建立並切換新分支
git checkout -b feature/new-feature

# 合併分支
git merge feature-branch

# 刪除分支
git branch -d branch-name

# 強制刪除分支
git branch -D branch-name
```

### 同步操作:
```bash
# 拉取最新更新
git pull origin master

# 推送到遠端
git push origin master

# 推送所有分支
git push origin --all

# 推送標籤
git push origin --tags
```

## 🏷️ 版本標籤管理

### 建立版本標籤:
```bash
# 建立輕量標籤
git tag v1.0.0

# 建立附註標籤
git tag -a v1.0.0 -m "TimeTracker Pro v1.0.0 正式版本"

# 推送標籤到遠端
git push origin v1.0.0

# 推送所有標籤
git push origin --tags
```

### 版本號規則 (Semantic Versioning):
- `v1.0.0`: 主要版本.次要版本.修補版本
- `v1.0.0-beta.1`: 預發布版本
- `v1.0.0-rc.1`: 候選版本

## 🔄 自動化部署設置

### GitHub Actions (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Production

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Build
      run: npm run build
    - name: Deploy
      run: echo "部署到生產環境"
```

## 📋 每日工作檢查清單

### 開始工作:
- [ ] `git status` - 檢查當前狀態
- [ ] `git pull origin master` - 同步最新代碼
- [ ] `git checkout -b feature/task-name` - 建立功能分支

### 完成工作:
- [ ] `git add .` - 添加變更
- [ ] `git commit -m "feat: 描述"` - 提交變更
- [ ] `git push origin feature/task-name` - 推送到遠端
- [ ] 建立 Pull Request/Merge Request

### 結束工作:
- [ ] `git checkout master` - 切回主分支
- [ ] `git pull origin master` - 同步最新代碼
- [ ] `git branch -d feature/task-name` - 清理本地分支

---

**建立時間**: 2025年7月2日  
**維護者**: TimeTracker Pro 開發團隊
