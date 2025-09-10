# Migration Guide for Teammates (XAMPP → No-XAMPP)

This guide helps your teammates migrate from the old XAMPP version to the new no-XAMPP setup.

## What Changed

### ✅ What's New
- **No more XAMPP Apache** - Uses PHP's built-in server instead
- **New startup script** - `start.bat` runs both servers
- **Same code** - All your PHP APIs and React components unchanged
- **Same database** - Still using Supabase (Supavisor session mode)

### ✅ What Stays the Same
- All your existing code in `src/` and `api/` folders
- Database connection and queries
- React components and functionality
- Git workflow and collaboration

## Steps for Your Teammates

### Step 1: Pull the Latest Code
```bash
git pull origin main
# (or whatever your main branch is called)
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Install PHP (if not already installed)

**Option A: Use XAMPP's PHP (Easiest)**
1. Make sure XAMPP is installed
2. Add `D:\xampp\php` to your Windows PATH
3. Restart command prompt
4. Test: `php --version`

**Option B: Install PHP Standalone**
1. Download from: https://windows.php.net/download/
2. Add to PATH during installation
3. Test: `php --version`

### Step 4: Start the Application
```bash
start.bat
```

That's it! The script will:
- Check if Node.js and PHP are available
- Install dependencies if needed
- Start both servers automatically

## What They'll See

### ✅ Success Output
```
Starting Budget Management System (No XAMPP)...
✓ Node.js found
✓ PHP found
Starting development servers...
- Frontend (React): http://localhost:5173
- Backend (PHP): http://localhost:8080
- Database: Supabase (Supavisor session mode)

Press Ctrl+C to stop both servers

[PHP] PHP 8.x.x Development Server (http://localhost:8080) started
[Vite] Local: http://localhost:5173/
```

### ❌ Common Issues & Solutions

**"php is not recognized"**
- **Solution**: Add XAMPP's PHP to PATH: `D:\xampp\php`
- **Or**: Install PHP standalone

**"Node.js is not installed"**
- **Solution**: Install Node.js from https://nodejs.org/

**Port conflicts (8080 or 5173 already in use)**
- **Solution**: Kill processes using those ports or change ports in config

**Database connection issues**
- **Solution**: Check `db_supabase.php` has correct Supabase credentials

## Testing the Setup

### 1. Test Backend API
- Go to: http://localhost:8080/api/health.php
- Should see JSON with database connection info

### 2. Test Frontend
- Go to: http://localhost:5173
- Should see React login page

### 3. Test Full Flow
- Try logging in
- Check dashboard loads
- Test creating/viewing requests

## Development Workflow

### Daily Development
```bash
# Start both servers
start.bat

# Make changes to:
# - React components in src/
# - PHP APIs in api/
# - Both will hot reload automatically

# Stop servers: Press Ctrl+C
```

### Git Workflow (Unchanged)
```bash
# Pull latest changes
git pull origin main

# Make your changes
# ... edit code ...

# Commit and push
git add .
git commit -m "Your changes"
git push origin main
```

## Troubleshooting

### If start.bat doesn't work
```bash
# Manual start (2 terminals needed)
# Terminal 1: PHP backend
D:\xampp\php\php.exe -S localhost:8080 -t .

# Terminal 2: React frontend
npm run dev
```

### If database connection fails
- Check `db_supabase.php` has correct Supabase credentials
- Test with: http://localhost:8080/api/health.php

### If React doesn't load
- Check if port 5173 is free
- Try: `npm run dev` manually

## Benefits of New Setup

1. **Simpler** - No Apache configuration needed
2. **Faster** - Direct PHP server, no Apache overhead  
3. **Portable** - Easy to move between machines
4. **Modern** - Uses Vite for fast development
5. **Same code** - All existing logic works unchanged

## Need Help?

If teammates run into issues:
1. Check this guide first
2. Verify PHP and Node.js are installed
3. Test with manual commands above
4. Check the `NO_XAMPP_GUIDE.md` for more details

## Quick Reference

| Old (XAMPP) | New (No-XAMPP) |
|-------------|----------------|
| `http://localhost/Capstone` | `http://localhost:8080` |
| Apache on port 80 | PHP server on port 8080 |
| `npm run dev` | `start.bat` |
| XAMPP Control Panel | Built-in PHP server |
