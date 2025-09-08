# Set UTF-8 to avoid encoding issues
chcp 65001 | Out-Null

# CONFIG
$MySqlBin = "D:\XAMPP\mysql\bin"            # adjust if needed
$MysqlExe = Join-Path $MySqlBin "mysql.exe"
$DbName   = "budget_database_schema"
$User     = "root"
$Pass     = ""                              # empty for XAMPP default
$OutDir   = "D:\XAMPP\htdocs\Capstone\mysql_exports"  # output folder

# Ensure output dir exists
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Export-Table {
    param([string]$Table)

    $tsvPath = Join-Path $OutDir "$Table.tsv"
    $csvPath = Join-Path $OutDir "$Table.csv"

    Write-Host "Exporting $Table ..."

    # Build args: -B (tab-separated), keep headers (no -N), select DB with -D
    $args = @("-u", $User, "-B", "-D", $DbName, "-e", "SELECT * FROM $Table;")
    if ($Pass -ne "") {
        $args = @("-u", $User, "-p$Pass", "-B", "-D", $DbName, "-e", "SELECT * FROM $Table;")
    }

    # Export TSV
    & $MysqlExe @args | Out-File -FilePath $tsvPath -Encoding utf8

    if (-not (Test-Path $tsvPath -PathType Leaf)) {
        Write-Warning "No TSV produced for $Table"
        return
    }

    # Convert TSV → CSV using headers from first line
    $data = Get-Content $tsvPath
    if ($data.Length -le 1) {
        Write-Warning "No data for $Table (only header or empty). Creating empty CSV."
        "" | Out-File -FilePath $csvPath -Encoding utf8
        return
    }

    try {
        $csv = $data | ConvertFrom-Csv -Delimiter "`t"
        $csv | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
    } catch {
        Write-Warning ("ConvertFrom-Csv failed for {0}: {1}. Attempting safe re-write of headers." -f $Table, $_.Exception.Message)
        # Fallback: sanitize duplicate header names by appending suffixes
        $header = $data[0].Split("`t")
        $seen = @{}
        for ($i=0; $i -lt $header.Length; $i++) {
            $col = $header[$i]
            if ($seen.ContainsKey($col)) {
                $seen[$col] += 1
                $header[$i] = "$col`_$($seen[$col])"
            } else {
                $seen[$col] = 0
            }
        }
        $fixed = @()
        $fixed += ($header -join "`t")
        $fixed += $data[1..($data.Length-1)]
        $csv = $fixed | ConvertFrom-Csv -Delimiter "`t"
        $csv | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
    }
}

# Export order respecting foreign keys
$tables = @(
  "group_table",
  "cluster",
  "division",
  "campus",
  "department",
  "account",
  "gl_account",
  "budget_category",
  "fund_type",
  "nature",
  "project_account",
  "budget_request",
  "budget_entries",
  "history",
  "approval_workflow",
  "approval_progress",
  "attachments",
  "budget_amendments",
  "budget_amendment_entries",
  "amendment_attachments",
  "dept_lookup"
)

$tables | ForEach-Object {
    Remove-Item -ErrorAction SilentlyContinue (Join-Path $OutDir "$_.tsv"), (Join-Path $OutDir "$_.csv")
    Export-Table $_
}

Write-Host "Done. CSVs in $OutDir"

# Keep the window open so you can see any errors
Read-Host "Press Enter to exit"