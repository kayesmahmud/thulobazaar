# ⚡ Quick Start - ThuluBazaar Monorepo

## 🚀 Get Started in 5 Minutes

### 1️⃣ Install Everything
```bash
cd /Users/elw/Documents/Web/thulobazaar/monorepo
npm install
```

### 2️⃣ Build Shared Packages
```bash
npm run build
```

### 3️⃣ Setup Environment
```bash
cd apps/web
cp .env.example .env.local
```

### 4️⃣ Start Development
```bash
cd ../..
npm run dev:web
```

### 5️⃣ Open Browser
```
http://localhost:3000
```

---

## ✅ You Should See

A welcome page showing:
- ✅ Monorepo is working
- ✅ Shared packages are loaded
- ✅ Example of formatPrice() and formatRelativeTime()
- ✅ TypeScript is working

---

## 📝 Common Commands

```bash
# Start web app
npm run dev:web

# Build everything
npm run build

# Type check everything
npm run type-check

# Clean everything
npm run clean
```

---

## 🎯 What You Got

### Shared Packages (60-70% reusable code)
- `@thulobazaar/types` - All TypeScript types
- `@thulobazaar/utils` - Common utilities (dates, prices, validation)
- `@thulobazaar/api-client` - API client for web & mobile

### Web App
- Next.js 14 + TypeScript
- App Router
- i18n ready (en/ne)
- SEO optimized

### Ready for Mobile
- Same types, utils, API client work in React Native!

---

## 📖 Full Documentation

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete details.

---

## 🐛 Troubleshooting

**Cannot find module error?**
```bash
npm run build
```

**Port 3000 in use?**
```bash
npx kill-port 3000
```

**TypeScript errors?**
```bash
npm install
npm run type-check
```
