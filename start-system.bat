@echo off
cd C:\Users\chave\OneDrive\Escritorio\React-main\backend
node server.js > backend.log 2>&1
echo Backend started on port 6060
timeout /t 2 /wait >nul
cd C:\Users\chave\OneDrive\Escritorio\React-main
npm run dev > frontend.log 2>&1
echo Frontend started on port 5133