# Complete Installation Guide for XAMPP + React Setup

This guide provides complete installation instructions for running the Budget Management System on a machine that has XAMPP but needs React and Node.js installed.

## What This Setup Does

- ✅ **Keeps all your existing PHP code** - No changes to API endpoints
- ✅ **Removes XAMPP Apache dependency** - Uses PHP's built-in server instead
- ✅ **Keeps Supabase database** - Still using Supavisor session mode
- ✅ **Uses Node.js** - For running both servers simultaneously
- ✅ **No supabase-js needed** - You're keeping PHP backend

## Prerequisites Check

### ✅ What You Already Have
- **XAMPP** - Installed and working
- **PHP** - Available via XAMPP (we'll use this)
- **Database** - Supabase PostgreSQL configured

### ❌ What You Need to Install
- **Node.js** - For React development server
- **Git** - For cloning the repository (if not already installed)

## Complete Installation Steps

### Step 1: Install Node.js

1. **Download Node.js**:
   - Go to: https://nodejs.org/
   - Download the **LTS version** (recommended)
   - Choose the Windows Installer (.msi)

2. **Install Node.js**:
   - Run the downloaded .msi file
   - Follow the installation wizard
   - ✅ **Important**: Check "Add to PATH" during installation
   - Complete the installation

3. **Verify Installation**:
   ```bash
   # Open Command Prompt or PowerShell
   node --version
   npm --version
   ```
   - You should see version numbers (e.g., v18.17.0, 9.6.7)

### Step 2: Install Git (if not already installed)

1. **Download Git**:
   - Go to: https://git-scm.com/download/win
   - Download the latest version

2. **Install Git**:
   - Run the installer
   - Use default settings
   - Complete the installation

3. **Verify Installation**:
   ```bash
   git --version
   ```

### Step 3: Clone/Download the Project

#### Option A: If you have the project files
- Copy the project folder to your desired location
- Skip to Step 4

#### Option B: If cloning from Git
```bash
# Navigate to your desired directory
cd C:\Users\YourUsername\Documents

# Clone the repository (replace with your actual repo URL)
git clone https://github.com/yourusername/budget-management-system.git

# Navigate to the project folder
cd budget-management-system
```

### Step 4: Configure PHP Path (Use XAMPP's PHP)

1. **Add XAMPP PHP to PATH**:
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Click "Environment Variables"
   - Under "System Variables", find and select "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\xampp\php` (adjust path if XAMPP is installed elsewhere)
   - Click "OK" on all dialogs

2. **Restart Command Prompt**:
   - Close all Command Prompt/PowerShell windows
   - Open a new Command Prompt

3. **Verify PHP Access**:
   ```bash
   php --version
   ```
   - You should see PHP version information

### Step 5: Install Project Dependencies

1. **Navigate to Project Directory**:
   ```bash
   cd path\to\your\project\folder
   ```

2. **Install Node.js Dependencies**:
   ```bash
   npm install
   ```
   - This will install React, Vite, and other dependencies
   - Wait for installation to complete

3. **Verify Installation**:
   ```bash
   npm list --depth=0
   ```
   - You should see all installed packages

### Step 6: Start the Application

1. **Start Both Servers**:
   ```bash
   # Option 1: Use the convenient batch file
   start.bat
   
   # Option 2: Manual start (if batch file doesn't work)
   npm run start:dev
   ```

2. **What Happens**:
   - ✅ **PHP Server** starts on port 8080
   - ✅ **React Server** starts on port 5173
   - ✅ **Both servers** run simultaneously
   - ✅ **Hot reload** enabled for development

3. **Access the Application**:
   - **Frontend (React)**: http://localhost:5173
   - **Backend API (PHP)**: http://localhost:8080
   - **Database**: Supabase (via Supavisor session mode)

4. **Test the Setup**:
   - Open http://localhost:5173 in your browser
   - You should see the login page
   - Try logging in with your credentials

## Troubleshooting Common Issues

### Issue 1: "node is not recognized"
**Solution**:
- Restart Command Prompt after installing Node.js
- Or reinstall Node.js with "Add to PATH" checked

### Issue 2: "php is not recognized"
**Solution**:
- Add XAMPP's PHP to PATH: `C:\xampp\php`
- Restart Command Prompt
- Or use full path: `C:\xampp\php\php.exe -S localhost:8080 -t .`

### Issue 3: "npm install" fails
**Solutions**:
- Check internet connection
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

### Issue 4: Port already in use
**Solutions**:
- Kill processes using ports 5173 or 8080
- Or change ports in `vite.config.js` and `package.json`

### Issue 5: Database connection fails
**Solutions**:
- Check `db_supabase.php` configuration
- Test connection: http://localhost:8080/api/health.php
- Verify Supabase credentials are correct

## Development Workflow

### Daily Development
1. **Start the application**:
   ```bash
   start.bat
   ```

2. **Make changes**:
   - Edit React components in `src/` folder
   - Edit PHP APIs in `api/` folder
   - Both servers have hot reload enabled

3. **Test changes**:
   - Frontend changes: Refresh browser at http://localhost:5173
   - Backend changes: Test API endpoints at http://localhost:8080

4. **Stop servers**: Press `Ctrl+C` in the terminal

### File Structure Overview
```
project/
├── src/                    # React frontend components
│   ├── components/         # React components
│   ├── App.jsx            # Main React app
│   └── main.jsx           # React entry point
├── api/                   # PHP backend APIs
│   ├── requester/         # Requester-specific APIs
│   ├── approver/          # Approver-specific APIs
│   └── health.php         # Health check endpoint
├── uploads/               # File uploads directory
├── package.json           # Node.js dependencies
├── vite.config.js         # Vite configuration
├── start.bat             # Easy startup script
└── db_supabase.php       # Database connection
```

## Production Deployment Options

### Option 1: Static Hosting + PHP Backend (For now)
```bash
# 1. Build React app for production
npm run build

# 2. Deploy frontend
# Upload the 'dist' folder to:
# - Netlify (netlify.com)
# - Vercel (vercel.com)
# - GitHub Pages
# - Any static hosting service

# 3. Deploy PHP backend
# Upload PHP files to:
# - Shared hosting with PHP support
# - VPS with PHP installed
# - Cloud services (Heroku, DigitalOcean, etc.)
```

### Option 2: Full VPS Deployment
```bash
# 1. Upload all files to your server
# 2. Install Node.js and PHP on the server
# 3. Install dependencies: npm install
# 4. Build React app: npm run build
# 5. Configure web server (Apache/Nginx) to serve:
#    - Static files from 'dist' folder
#    - PHP files from project root
```

### Option 3: Docker Deployment
```bash
# Create Dockerfile for containerized deployment
# Deploy to Docker-compatible hosting services
```

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Node.js**: Version 16 or higher
- **PHP**: Version 7.4 or higher (included with XAMPP)

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 5GB free space
- **Node.js**: Latest LTS version
- **PHP**: Version 8.0 or higher

## Security Considerations

### Development Environment
- ✅ **Local only**: Servers run on localhost
- ✅ **No external access**: By default, only accessible from your machine
- ✅ **HTTPS**: Not required for local development

### Production Environment
- ⚠️ **HTTPS required**: Use SSL certificates
- ⚠️ **Environment variables**: Store sensitive data securely
- ⚠️ **Database security**: Use Supabase RLS policies
- ⚠️ **File uploads**: Validate and sanitize uploaded files

## Performance Tips

### Development
- Use `npm run start:dev` for hot reload
- Keep both servers running during development
- Use browser dev tools for debugging

### Production
- Build React app with `npm run build`
- Enable gzip compression
- Use CDN for static assets
- Optimize database queries

## Support and Maintenance

### Regular Updates
- Keep Node.js updated: `npm update`
- Keep dependencies updated: `npm audit fix`
- Monitor Supabase for database updates

### Backup Strategy
- **Code**: Use Git for version control
- **Database**: Supabase handles backups automatically
- **Files**: Backup `uploads/` folder regularly

### Monitoring
- Check application health: http://localhost:8080/api/health.php
- Monitor server logs for errors
- Use browser dev tools for frontend debugging

## Next Steps After Installation

1. ✅ **Test the setup**: Run `start.bat` and verify everything works
2. ✅ **Explore the code**: Check out the React components and PHP APIs
3. ✅ **Customize**: Modify the application to fit your needs
4. ✅ **Deploy**: Choose a production deployment option
5. ✅ **Monitor**: Set up monitoring and backup strategies

## Getting Help

### Common Resources
- **Node.js Docs**: https://nodejs.org/docs/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/
- **PHP Docs**: https://www.php.net/docs.php
- **Supabase Docs**: https://supabase.com/docs

### Troubleshooting Steps
1. Check all prerequisites are installed
2. Verify PATH environment variables
3. Check port availability
4. Review error messages carefully
5. Test each component individually
