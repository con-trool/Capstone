@echo off
echo Starting Budget Management System (No XAMPP)...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PHP is available (try XAMPP first, then PATH)
D:\xampp\php\php.exe --version >nul 2>&1
if %errorlevel% neq 0 (
    php --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: PHP is not available
        echo.
        echo OPTION 1: Install PHP standalone
        echo   Download from: https://windows.php.net/download/
        echo.
        echo OPTION 2: Use XAMPP's PHP (add to PATH)
        echo   Add this to your PATH: D:\xampp\php
        echo   Then restart this command prompt
        echo.
        pause
        exit /b 1
    ) else (
        set PHP_CMD=php
    )
) else (
    set PHP_CMD=D:\xampp\php\php.exe
)

echo ✓ Node.js found
echo ✓ PHP found
echo.

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting development servers...
echo - Frontend (React): http://localhost:5173
echo - Backend (PHP): http://localhost:8080
echo - Database: Supabase (Supavisor session mode)
echo.

echo Press Ctrl+C to stop both servers
echo.

REM Start both servers
npm run start:dev
