# ARCVA 2.0 - Setup Automatizado (Windows PowerShell)
# Uso: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ARCVA 2.0 - Setup" -ForegroundColor Cyan
Write-Host "  ====================" -ForegroundColor Cyan
Write-Host ""

# 0. Verificar pre-requisitos (Vite 8 exige Node ^20.19 ou >=22.12)
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "ERRO: Node.js nao encontrado. Instalar >= 20.19 em https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVersion = [version](node --version).TrimStart('v')
$supported = ($nodeVersion.Major -eq 20 -and $nodeVersion -ge [version]"20.19.0") -or
             ($nodeVersion.Major -ge 22 -and $nodeVersion -ge [version]"22.12.0")
if (-not $supported) {
    Write-Host "ERRO: Node v$nodeVersion nao suportado. Requerido: ^20.19.0 ou >=22.12.0" -ForegroundColor Red
    exit 1
}
Write-Host "[0/4] Node v$nodeVersion OK" -ForegroundColor Green

# 1. Instalar dependencias
Write-Host "[1/4] A instalar dependencias..." -ForegroundColor Yellow
npm install
Write-Host "      Dependencias instaladas." -ForegroundColor Green

# 2. Copiar .env.example para .env.local se nao existir
if (!(Test-Path .env.local)) {
    Copy-Item .env.example .env.local
    Write-Host "[2/4] .env.local criado a partir de .env.example" -ForegroundColor Green
} else {
    Write-Host "[2/4] .env.local ja existe, a manter" -ForegroundColor Yellow
}

# 3. Configurar Convex
Write-Host "[3/4] A configurar Convex..." -ForegroundColor Yellow
Write-Host "      Se e a primeira vez, vai ser pedido para criar conta/projeto."
npx convex dev --once
Write-Host "      Convex configurado." -ForegroundColor Green

# 4. Configurar API Key do Gemini no Convex
Write-Host ""
Write-Host "[4/4] Configuracao da API Key do Google Gemini" -ForegroundColor Yellow
Write-Host "      (Necessaria para funcionalidades AI: chat, TTS, geracao de imagem)"
Write-Host ""
$hasKey = Read-Host "      Tens uma API Key do Gemini? (s/n)"
if ($hasKey -eq "s" -or $hasKey -eq "S") {
    Write-Host "      Introduz a tua API Key:"
    npx convex env set GEMINI_API_KEY
    Write-Host "      API Key configurada no Convex!" -ForegroundColor Green
} else {
    Write-Host "      Podes obter uma em: https://aistudio.google.com/apikey" -ForegroundColor Yellow
    Write-Host "      Depois configura com: npx convex env set GEMINI_API_KEY"
}

# Verificar
Write-Host ""
Write-Host "  Setup completo!" -ForegroundColor Green
Write-Host ""
Write-Host "  Comandos para iniciar:"
Write-Host "    npx convex dev    (terminal 1 - backend)" -ForegroundColor White
Write-Host "    npm run dev        (terminal 2 - frontend)" -ForegroundColor White
Write-Host ""
Write-Host "  Abrir em: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
