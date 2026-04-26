@echo off
cd /d "%~dp0"
echo Starting AquaBasket on http://127.0.0.1:5500/index.html
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:5500/index.html'"
python -m http.server 5500
