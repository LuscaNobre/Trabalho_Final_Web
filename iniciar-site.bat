@echo off
chcp 65001 >nul
title Estudio Street 095 - servidor
cd /d "%~dp0"

echo ==========================================
echo   Estudio Street 095 - iniciando o projeto
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js/npm nao encontrado. Instale o Node.js 20+ em https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias pela primeira vez...
  call npm install || (echo [ERRO] Falha no npm install & pause & exit /b 1)
)

if not exist "server\.env" (
  echo [ERRO] Falta o arquivo server\.env. Copie server\.env.example para server\.env.
  pause
  exit /b 1
)

echo Cadastrando dados de demonstracao (nao duplica se ja existirem)...
call npm run seed:demo
if errorlevel 1 (
  echo.
  echo [ERRO] Nao foi possivel conectar ao MongoDB.
  echo Ligue o MongoDB: abra o PowerShell como administrador e rode  net start MongoDB
  echo ou coloque a URI do MongoDB Atlas em MONGODB_URI no server\.env
  pause
  exit /b 1
)

echo.
echo Abrindo http://localhost:5173 em alguns segundos...
start "" cmd /c "timeout /t 6 >nul && start http://localhost:5173"

echo Deixe esta janela aberta enquanto usa o site. Para parar: Ctrl+C
echo.
call npm run dev
pause
