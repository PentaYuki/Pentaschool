# 🚀 DEPLOYMENT GUIDE - Vercel Setup

**Project**: PentaSchool (pentaschool)  
**Framework**: Next.js 16.1.6  
**Repository**: https://github.com/PentaYuki/Pentaschool.git  
**Date**: 2026-04-19

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [x] Build successful locally: `npm run build` ✓
- [x] All changes committed to Git ✓
- [x] Pushed to GitHub master ✓
- [x] SafeMathRenderer fixed (CodeCogs PNG) ✓
- [ ] Environment variables prepared
- [ ] Database ready (PostgreSQL)
- [ ] Redis setup (optional)
- [ ] Vercel project created

---

## 📋 STEP 1: Create Vercel Project

### Option A: Using Vercel CLI (Fastest)

```bash
# 1. Install Vercel CLI globally (if not already)
npm install -g vercel

# 2. Login to Vercel
vercel login
# → Select GitHub (recommended)
# → Authorize with GitHub account

# 3. Deploy
vercel
# → Automatically detects Next.js project
# → Asks for project settings
# → Creates deployment
```

### Option B: Vercel Web Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Continue with GitHub"
4. Select repository: **PentaYuki/Pentaschool** (or sync your fork)
5. Click "Import"
6. Vercel auto-configures Next.js settings
7. Add environment variables (see Step 2)
8. Click "Deploy"

---

## 🔐 STEP 2: Configure Environment Variables

On Vercel Dashboard → Project Settings → Environment Variables

### **Required Variables:**

```bash
# ═══════════════════════════════════════════════════════════
# DATABASE (PostgreSQL)
# ═══════════════════════════════════════════════════════════
DATABASE_URL=postgresql://user:password@host:5432/pentaschool_prod
DIRECT_URL=postgresql://user:password@host:5432/pentaschool_prod
# Note: DIRECT_URL for migrations, DATABASE_URL for app

# ═══════════════════════════════════════════════════════════
# JWT & SECURITY
# ═══════════════════════════════════════════════════════════
JWT_SECRET=your-super-secret-key-min-32-chars-long-HERE
JWT_REFRESH_SECRET=your-refresh-secret-key-32-chars-HERE
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-HERE

# ═══════════════════════════════════════════════════════════
# SUPABASE (if using file storage)
# ═══════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_BUCKET_NAME=pentaschool
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...

# ═══════════════════════════════════════════════════════════
# REDIS (for BullMQ job queue - optional but recommended)
# ═══════════════════════════════════════════════════════════
REDIS_URL=redis://user:password@host:6379/0
# Get from: Upstash.com or Redis Cloud

# ═══════════════════════════════════════════════════════════
# AWS S3 (if using AWS for uploads)
# ═══════════════════════════════════════════════════════════
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxxx...
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=pentaschool-storage

# ═══════════════════════════════════════════════════════════
# Email Service (if needed)
# ═══════════════════════════════════════════════════════════
SENDGRID_API_KEY=SG.xxxxx...
SENDGRID_FROM_EMAIL=noreply@pentaschool.vn

# ═══════════════════════════════════════════════════════════
# Node Environment
# ═══════════════════════════════════════════════════════════
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://pentaschool-prod.vercel.app
# (Change domain if using custom domain)
```

### How to add on Vercel:

```
1. Settings → Environment Variables
2. Add Name → Add Value
3. Select environments: Production + Preview
4. Click "Save"
```

---

## 🗄️ STEP 3: Database Setup

### Create PostgreSQL Database

**Option A: Supabase (Recommended for ease)**
```
1. Go to https://supabase.com
2. Create new project
3. Wait for initialization (5-10 min)
4. Copy Connection String from Settings → Database
5. Generate DIRECT_URL for migrations
```

**Option B: Railway.app (Easy Railway deployment)**
```
1. Go to https://railway.app
2. Create PostgreSQL database
3. Copy DATABASE_URL from Variables
```

**Option C: Self-Managed (AWS RDS)**
```
1. Create RDS PostgreSQL instance
2. Configure security groups for Vercel IP ranges
3. Get connection string
```

### Run Migrations

After environment variables are set:

```bash
# LOCALLY (recommended first time)
export DATABASE_URL="your-prod-url"
export DIRECT_URL="your-prod-url"

npx prisma migrate deploy
npx prisma generate

# OR on Vercel (using CLI)
vercel env pull .env.production
vercel run "npx prisma migrate deploy"
```

### Seed Database (Optional)

```bash
npm run prisma:seed
```

---

## 🔄 STEP 4: Deployment Pipeline

### GitHub Actions (Auto-Deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Auto-Deploy to Vercel

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Get Vercel Tokens

1. Vercel Account → Settings → Tokens
2. Generate new token → copy to GitHub Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

---

## ✅ STEP 5: Verify Deployment

### Check Live URL

```bash
# Vercel shows deployment URL after build completes
# Format: https://pentaschool-xxxxx.vercel.app

# Or use custom domain: https://pentaschool.vn (setup in Settings → Domains)
```

### Test Critical Features

```
1. Login/Register
   ✓ Can login with email?
   ✓ Can register new user?
   ✓ JWT tokens working?

2. Quiz with Math Formulas
   ✓ Load quiz with $..$ formulas?
   ✓ Formulas display as images (CodeCogs)?
   ✓ No red error text?

3. File Upload
   ✓ Can upload documents?
   ✓ Files stored in Supabase/S3?

4. Database
   ✓ Can read/write data?
   ✓ Migrations applied?
```

### Monitor Logs

```
Vercel Dashboard → Deployments → [latest] → Logs
- Check for errors
- Verify API calls
- Monitor cold starts
```

---

## 🐛 TROUBLESHOOTING

### Build Fails on Vercel

**Error**: `Can't find module 'X'`  
**Fix**:
```bash
npm install  # Re-install locally
git add package-lock.json
git push  # Re-deploy
```

### Database Connection Error

**Error**: `P1000: Can't reach database`  
**Fix**:
```
1. Check DATABASE_URL on Vercel
2. Test connection: psql $DATABASE_URL
3. Verify firewall allows Vercel IPs
4. Check database is running
```

### Math Formulas Not Displaying

**Error**: Formulas show as text/red instead of images  
**Check**:
```
1. DevTools → Network → filter "codecogs"
2. Is request to latex.codecogs.com succeeding?
3. Status: 200 OK? (Should be)
4. If 404: LaTeX syntax error
5. If timeout: CodeCogs slow or blocked
```

### Node Modules Too Large

**Error**: `Build exceeds size limits`  
**Fix**: Already handled in `next.config.ts`
```typescript
// KaTeX is chunk-optimized
// BullMQ excluded from client
```

---

## 🔄 Continuous Deployment

Every time you push to master:
1. GitHub Actions runs tests/build
2. Vercel watches for changes
3. Auto-deploys to production
4. Preview deployments for PRs

---

## 📱 Custom Domain Setup

1. Vercel Dashboard → Settings → Domains
2. Add domain: `pentaschool.vn`
3. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Wait 24-48 hours for propagation
5. Enable SSL certificate (auto)

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is strong (32+ chars)
- [ ] Database URL not in code
- [ ] Supabase/AWS credentials secured
- [ ] CORS properly configured
- [ ] CSP headers set in next.config.ts
- [ ] Rate limiting enabled
- [ ] Sensitive logs not exposed

---

## 📊 Monitoring & Maintenance

### Weekly Checks

```bash
# Monitor build times
# Check error rates in logs
# Verify database performance
# Test math formula rendering
```

### Monthly Tasks

```bash
# Review Vercel analytics
# Update dependencies (npm)
# Check Prisma version updates
# Security audit
```

---

## 🎓 Useful Commands

```bash
# View deployment status
vercel status

# Pull environment variables
vercel env pull

# Check logs
vercel logs

# Rollback to previous version
vercel rollback

# List all deployments
vercel ls
```

---

## 📞 Support

**Vercel Docs**: https://vercel.com/docs  
**Next.js Docs**: https://nextjs.org/docs  
**Prisma Docs**: https://www.prisma.io/docs  
**CodeCogs Docs**: https://www.codecogs.com

---

## ✨ Summary

| Step | Status | Link |
|------|--------|------|
| 1. Local Build | ✅ | `npm run build` |
| 2. Push to GitHub | ✅ | `git push origin master` |
| 3. Create Vercel Project | ⏳ | https://vercel.com/dashboard |
| 4. Set Env Variables | ⏳ | Settings → Env Variables |
| 5. Setup Database | ⏳ | Supabase.com |
| 6. Deploy | ⏳ | "Deploy" button on Vercel |
| 7. Verify Live | ⏳ | Check formulas show as images |

---

**Ready to deploy?** Start with Step 1: Create Vercel Project 🚀
