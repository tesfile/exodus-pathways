$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$stagingEnvPath = Join-Path $workspaceRoot ".env.staging.local"
$productionEnvPath = Join-Path $workspaceRoot ".env.local"

if (-not (Test-Path $stagingEnvPath)) {
  throw "Missing .env.staging.local. Keep production .env.local untouched."
}

$stagingValues = @{}
foreach ($line in Get-Content $stagingEnvPath) {
  $trimmed = $line.Trim()
  if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
  $separator = $trimmed.IndexOf("=")
  if ($separator -lt 1) { continue }
  $name = $trimmed.Substring(0, $separator).Trim()
  $value = $trimmed.Substring($separator + 1).Trim().Trim('"', "'")
  $stagingValues[$name] = $value
}

$expectedUrl = "https://rwikjhdehbambuztlcwu.supabase.co"
if ($stagingValues["NEXT_PUBLIC_SUPABASE_URL"] -ne $expectedUrl) {
  throw "Staging URL mismatch. Expected project ref rwikjhdehbambuztlcwu."
}
if ($stagingValues["NEXT_PUBLIC_SITE_URL"] -ne "http://localhost:3001") {
  throw "Set NEXT_PUBLIC_SITE_URL=http://localhost:3001 in .env.staging.local."
}
$key = $stagingValues["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
if (-not $key -or $key -eq "PASTE_STAGING_PUBLISHABLE_OR_ANON_KEY_HERE" -or -not $key.StartsWith("sb_publishable_")) {
  throw "Paste the staging publishable/anon key into NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.staging.local, then rerun. Do not paste it in chat."
}

# Explicitly prevent .env.local values from reaching this Next.js process.
# Next.js preserves already-defined process environment values over dotenv files.
if (Test-Path $productionEnvPath) {
  foreach ($line in Get-Content $productionEnvPath) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=') {
      $name = $Matches[1]
      if (-not $stagingValues.ContainsKey($name)) {
        Set-Item -Path "Env:$name" -Value ""
      }
    }
  }
}

# Clear any inherited Supabase values as well, so the launcher's behavior is
# independent of the shell/VS Code environment. These are the only Supabase
# variables read by the app's browser/server clients and middleware.
foreach ($name in @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL"
)) {
  Set-Item -Path "Env:$name" -Value ""
}

foreach ($name in $stagingValues.Keys) {
  Set-Item -Path "Env:$name" -Value $stagingValues[$name]
}
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $key

$projectHost = ([uri]$env:NEXT_PUBLIC_SUPABASE_URL).Host
Write-Output "Starting local Next.js with staging Supabase host $projectHost on http://localhost:3001. Production .env.local is unchanged and its values are suppressed for this process."
Set-Location $workspaceRoot
& npm.cmd run dev -- -p 3001
exit $LASTEXITCODE
