@echo off
echo ========================================
echo    GabaoIndex - GitHub Push Script
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Create a GitHub repository named 'gabonfind'
echo - Make it PUBLIC if you want it discoverable
echo - Do NOT initialize with README, .gitignore, or license
echo - Then come back here and continue
echo.
pause >nul

echo.
echo Step 2: Enter your GitHub username:
set /p username="GitHub Username: "

echo.
echo Step 3: Connecting to GitHub...
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/%username%/gabonfind.git

echo.
echo Step 4: Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push -u origin main

echo.
echo ========================================
echo         SUCCESS! Project pushed to GitHub
echo ========================================
echo.
echo Your repository: https://github.com/%username%/gabonfind
echo.
pause
