@echo off
cd /d "%~dp0"
set PORT=8765
echo Glass Ark: http://localhost:%PORT%/
where py >nul 2>nul && (start "" http://localhost:%PORT%/ & py -3 -m http.server %PORT% & goto :eof)
where python >nul 2>nul && (start "" http://localhost:%PORT%/ & python -m http.server %PORT% & goto :eof)
where npx >nul 2>nul && (start "" http://localhost:%PORT%/ & npx --yes http-server -p %PORT% -c-1 & goto :eof)
echo Python or Node.js not found. Please install Python or use VS Code Live Server.
pause