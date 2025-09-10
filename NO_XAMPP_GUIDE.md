# No-XAMPP Setup Guide

This guide helps you run the Budget Management System without XAMPP Apache, using only Supabase and PHP's built-in server.

## What This Setup Does

- ✅ **Keeps all your existing PHP code** - No changes to API endpoints
- ✅ **Removes XAMPP dependency** - Uses PHP's built-in server instead
- ✅ **Keeps Supabase database** - Still using Supavisor session mode
- ✅ **Uses Node.js** - For running both servers simultaneously
- ✅ **No supabase-js needed** - You're keeping PHP backend

## Prerequisites

### 1. Node.js (Already installed ✅)
- You mentioned you have Node.js installed
- This will run both PHP and React servers

### 2. PHP (Need to install)
You have two options:

#### Option A: Install PHP Standalone
- Download from: https://windows.php.net/download/
- Add to PATH during installation

#### Option B: Use XAMPP's PHP (Easier)
- Add `C:\xampp\php` to your Windows PATH
- Restart command prompt after adding to PATH

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start the application
```bash
# Option 1: Use the batch file
start.bat

# Option 2: Manual start
npm run start:dev
```

### 3. Access the application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Database**: Supabase (via Supavisor session mode)

## What Changed

### ✅ New Architecture
- **Frontend**: React on port 5173 (Vite dev server)
- **Backend**: PHP on port 8080 (built-in server)
- **Database**: Supabase PostgreSQL (Supavisor session mode)
- **No Apache**: Removed XAMPP dependency

### ✅ Files Modified
- `package.json` - Added PHP server scripts
- `vite.config.js` - Updated proxy to port 8080
- `start.bat` - Easy startup script

### ✅ What Stays the Same
- All your PHP API endpoints (`/api/` folder)
- Database connection (`db_supabase.php`)
- React components and logic
- Supabase configuration

## Development Workflow

1. **Start development**:
   ```bash
   start.bat
   ```

2. **Make changes**:
   - Edit React components in `src/`
   - Edit PHP APIs in `api/`
   - Hot reload works for both

3. **Stop servers**: Press Ctrl+C

## Production Deployment

### Option 1: Static Hosting (Recommended)
```bash
# Build React app
npm run build

# Deploy dist/ folder to any static host
# (Netlify, Vercel, GitHub Pages, etc.)
# Your PHP APIs would need to be deployed separately
```

### Option 2: VPS with PHP
```bash
# Upload all files to your server
# Install PHP and required extensions
# Run: php -S localhost:8080 -t .
# Or use Apache/Nginx with proper configuration
```

## Troubleshooting

### "php is not recognized"
- **Solution A**: Install PHP standalone and add to PATH
- **Solution B**: Add XAMPP's PHP to PATH: `C:\xampp\php`

### Port conflicts
- Change ports in `vite.config.js` and `package.json`
- Or kill processes using the ports

### Database connection issues
- Check `db_supabase.php` configuration
- Test with: http://localhost:8080/api/health.php

## Benefits

1. **Simpler**: No Apache configuration needed
2. **Faster**: Direct PHP server, no Apache overhead
3. **Portable**: Easy to move between machines
4. **Modern**: Uses Vite for fast development
5. **Same code**: All your existing PHP logic works unchanged

## Next Steps

1. Install PHP (if not already done)
2. Run `start.bat` to test the setup
3. Verify all functionality works
4. Consider production deployment options
