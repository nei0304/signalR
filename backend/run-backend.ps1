$ErrorActionPreference = "Stop"

# Avoid backend.exe lock conflicts by stopping existing backend process first.
Get-Process backend -ErrorAction SilentlyContinue | Stop-Process -Force

Set-Location $PSScriptRoot

dotnet run --project .\backend.csproj --urls http://localhost:5267
