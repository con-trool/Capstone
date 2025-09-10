# Quick Checklist for Teammates

## Before You Start
- [ ] Pull latest code: `git pull origin main`
- [ ] Have Node.js installed (https://nodejs.org/)
- [ ] Have PHP available (XAMPP or standalone)

## Setup Steps
- [ ] Run: `npm install`
- [ ] Run: `start.bat`
- [ ] Test: http://localhost:5173 (React frontend)
- [ ] Test: http://localhost:8080/api/health.php (Backend API)

## If Something Goes Wrong
- [ ] Check PHP is in PATH: `php --version`
- [ ] Check Node.js: `node --version`
- [ ] Kill any processes on ports 8080/5173
- [ ] Try manual start (see MIGRATION_FOR_TEAMMATES.md)

## Success Indicators
- [ ] Both servers start without errors
- [ ] React app loads at localhost:5173
- [ ] API responds at localhost:8080/api/health.php
- [ ] Can login and see dashboard

## Need Help?
- Read `MIGRATION_FOR_TEAMMATES.md` for detailed guide
- Read `NO_XAMPP_GUIDE.md` for technical details
