@echo off
cd /d "%~dp0"
echo Starting local dev server...
echo Open the URL shown below in your browser (usually http://localhost:5173)
echo Press Ctrl+C to stop.
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173"
npm run dev
pause