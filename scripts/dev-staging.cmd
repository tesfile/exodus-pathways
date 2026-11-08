@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-staging.ps1"
exit /b %ERRORLEVEL%
