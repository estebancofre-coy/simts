# 🚀 Deployment Guide - SimTS

Your changes have been pushed to GitHub. Now deploy to Vercel (frontend) and Render (backend).

## Recent Commit

```
commit: a2c55b9
feat: Add complete student authentication system with answer tracking and teacher review dashboard
- Student login modal with authentication
- Answer submission for multiple-choice and open-ended questions
- Teacher review tab with student answer filters
- Feedback and scoring system for teacher evaluations
- CSV and PDF export for student responses
```

**GitHub:** https://github.com/estebancofre-coy/simts

## 🌐 Frontend Deployment (Vercel)

### Option 1: Auto-Deploy (Recommended)
1. Go to https://vercel.com/new
2. Import your GitHub repository: `estebancofre-coy/simts`
3. Configure:
   - **Project Name**: simts-frontend (or similar)
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   ```

5. Deploy! Vercel will automatically redeploy on every push to `main`.

### Option 2: Existing Vercel Project
If you already have a Vercel project:
1. Go to your project settings
2. Update environment variables with new backend URL
3. Manually trigger a redeploy or push to GitHub to auto-trigger

## 🔧 Backend Deployment (Render)

### Option 1: Deploy on Render
1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect GitHub repository: `estebancofre-coy/simts`
4. Configure:
   - **Name**: simts-backend (or similar)
   - **Environment**: Python 3.11
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`
   - **Root Directory**: (leave empty, or use `.`)

5. **Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL=sqlite:///./cases.db
   PYTHONUNBUFFERED=true
   ```

6. Deploy! The service will be available at `https://simts-backend-xxx.onrender.com`

### Option 2: Update Existing Render Service
If you already have a Render service:
1. Go to your service dashboard
2. Go to "Environment" → Update variables if needed
3. Go to "Deploys" → Click "Manual Deploy" or redeploy from GitHub

## 📋 Post-Deployment Checklist

After deploying to both Vercel and Render:

- [ ] Backend is running: `curl https://your-render-backend.onrender.com/health`
- [ ] Frontend loads: Visit the Vercel URL in browser
- [ ] Student login works: Try `estudiante1` / `pass`
- [ ] Generate case: Click "Generar Nuevo Caso"
- [ ] Submit answers: Fill and click "Enviar Respuestas"
- [ ] Teacher panel: Click "Panel de Docente" to review answers

## 🔗 Environment Variables Summary

**Frontend (Vercel)**:
- `VITE_API_URL`: Your Render backend URL

**Backend (Render)**:
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: SQLite path (auto-managed)
- `PYTHONUNBUFFERED`: Set to `true`

## 📊 Current Features Deployed

✅ Student authentication system
✅ Multiple-choice and open-ended questions
✅ Answer submission and tracking
✅ Teacher review dashboard with filters
✅ Feedback and scoring system
✅ CSV/PDF export functionality
✅ Session-based case solving
✅ Answer history for students

## 🔄 Future Improvements

- [ ] Real user database (PostgreSQL instead of SQLite)
- [ ] JWT token authentication
- [ ] Email notifications for teachers
- [ ] Real-time answer scoring
- [ ] Advanced analytics dashboard
- [ ] Mobile app support

## 📞 Support

If you encounter deployment issues:
1. Check service logs in Vercel/Render dashboard
2. Verify environment variables are set correctly
3. Test API health: `curl https://your-backend/health`
4. Check frontend console for errors (F12)

