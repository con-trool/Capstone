# Setup Local PostgreSQL for Testing

## Quick Setup Steps:

1. **Download PostgreSQL for Windows:**
   - Go to https://www.postgresql.org/download/windows/
   - Download PostgreSQL 15 or 16
   - Install with default settings
   - Remember the password you set for 'postgres' user

2. **Create Database:**
   ```sql
   -- Connect to PostgreSQL as postgres user
   CREATE DATABASE budget_database_schema;
   ```

3. **Update db_supabase.php:**
   ```php
   $connectionString = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/budget_database_schema";
   ```

4. **Import Schema:**
   - Run the supabase_schema.sql file in your local PostgreSQL
   - Import your CSV data

## Alternative: Use XAMPP MySQL temporarily

If you want to test quickly without installing PostgreSQL:

1. **Revert to MySQL temporarily:**
   - Change `require '../db_supabase.php';` back to `require '../db.php';` in all API files
   - Start MySQL in XAMPP
   - Test your application

2. **Fix Supabase connectivity later:**
   - Check firewall settings
   - Try different network (mobile hotspot)
   - Contact Supabase support about IPv6 connectivity
