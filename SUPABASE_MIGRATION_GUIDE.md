# Supabase Migration Guide

This guide will help you migrate your XAMPP MySQL budget management system to Supabase PostgreSQL.

## Prerequisites

1. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project and note your credentials
3. **PostgreSQL Client**: Install a PostgreSQL client (optional, for manual operations)

## Step 1: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note your project credentials:
   - Host: `your-project-ref.supabase.co`
   - Database: `postgres`
   - Username: `postgres`
   - Password: (the one you set during project creation)
   - Port: `5432`

## Step 2: Update Database Configuration

1. Open `db_supabase.php`
2. Replace the placeholder values with your actual Supabase credentials:
   ```php
   $host = "your-project-ref.supabase.co";
   $password = "your-actual-password";
   ```

## Step 3: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase_schema.sql`
4. Paste and run the SQL to create all tables and sample data

## Step 4: Migrate Your Data

### Option A: Use Supabase Migration Tool (Recommended)

1. Go to [Supabase Migration Tool on Google Colab](https://colab.research.google.com/github/supabase/migration-tool/blob/main/migration_tool.ipynb)
2. Set these environment variables:
   ```
   HOST = "localhost"
   USER = "root"
   SOURCE_DB = "budget_database_schema"
   PASSWORD = ""
   SUPABASE_URL = "your-supabase-url"
   SUPABASE_PASSWORD = "your-supabase-password"
   ```
3. Run the migration steps

### Option B: Manual Data Export/Import

1. Export your MySQL data:
   ```bash
   mysqldump -u root -p budget_database_schema > mysql_export.sql
   ```

2. Convert the data format and import to Supabase

## Step 5: Update PHP Files

### Files to Update

Update these files to use the new Supabase connection:

- `api/login.php`
- `api/requester/create_request.php`
- `api/requester/update_request.php`
- `api/requester/delete_request.php`
- `api/requester/get_request.php`
- `api/requester/requests.php`
- `api/approver/requests.php`
- `api/process_approval.php`
- `api/request_details.php`
- `create_request.php`
- `edit_request.php`
- `update_request.php`
- `delete_request.php`
- `submit_request.php`
- `process_approval.php`
- `fetch_request_details.php`
- `fetch_approval_details.php`
- `get_request_data.php`
- `workflow_manager.php`
- `process_amendment.php`
- `load_category_template.php`
- `analytics.php`

### Changes Required

1. **Change database include**:
   ```php
   // From:
   require '../db.php';
   // To:
   require '../db_supabase.php';
   ```

2. **Update query syntax**:
   ```php
   // MySQL (old):
   $stmt = $conn->prepare("SELECT * FROM account WHERE username_email = ?");
   $stmt->bind_param("s", $email);
   $stmt->execute();
   $result = $stmt->get_result();
   $user = $result->fetch_assoc();

   // PostgreSQL (new):
   $sql = "SELECT * FROM account WHERE username_email = :email";
   $stmt = $conn->prepare($sql);
   $stmt->bindParam(':email', $email);
   $stmt->execute();
   $user = $stmt->fetch();
   ```

3. **Update data types**:
   - `AUTO_INCREMENT` → `SERIAL`
   - `ENUM` → `CHECK` constraints
   - Boolean values: `0/1` → `true/false`

## Step 6: Test Your Application

1. Run `migrate_to_supabase.php` to test connections
2. Test each updated file individually
3. Verify all functionality works as expected

## Key Differences Between MySQL and PostgreSQL

### Data Types
- `AUTO_INCREMENT` → `SERIAL`
- `ENUM('value1', 'value2')` → `VARCHAR(50) CHECK (column IN ('value1', 'value2'))`
- `TEXT` → `TEXT` (same)
- `DECIMAL(12,2)` → `DECIMAL(12,2)` (same)

### Query Syntax
- `LIMIT 10` → `LIMIT 10` (same)
- `CONCAT(str1, str2)` → `str1 || str2`
- `NOW()` → `CURRENT_TIMESTAMP`
- `CURDATE()` → `CURRENT_DATE`

### Connection
- MySQL: `mysqli`
- PostgreSQL: `PDO`

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check your Supabase credentials
2. **Query Errors**: Verify PostgreSQL syntax
3. **Data Type Errors**: Check boolean and enum conversions
4. **Permission Errors**: Verify RLS policies in Supabase

### Getting Help

1. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. PostgreSQL documentation: [postgresql.org/docs](https://postgresql.org/docs)
3. Test your queries in Supabase SQL Editor

## Security Considerations

1. **Row Level Security (RLS)**: Enabled on all tables
2. **API Keys**: Store securely in environment variables
3. **Database Credentials**: Never commit to version control
4. **HTTPS**: Always use HTTPS in production

## Performance Optimization

1. **Indexes**: Created on frequently queried columns
2. **Connection Pooling**: Supabase handles this automatically
3. **Query Optimization**: Use EXPLAIN to analyze queries

## Next Steps

1. Complete the migration
2. Test thoroughly
3. Deploy to production
4. Monitor performance
5. Set up backups

## Support

For issues specific to this migration:
1. Check the error logs
2. Verify your Supabase project settings
3. Test individual components
4. Review the migration checklist

Good luck with your migration! 🚀
