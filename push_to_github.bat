@echo off
echo ========================================
echo    GabaoIndex - GitHub Push Script
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Creating GitHub repository...
echo Please go to https://github.com/new and create a repository named 'gabonfind'
echo - Make it PUBLIC
echo - DO NOT initialize with README, .gitignore, or license
echo - Click "Create repository"
echo.
echo Press any key when you've created the repository...
pause >nul

echo.
echo Step 2: Enter your GitHub username:
set /p username="GitHub Username: "

echo.
echo Step 3: Connecting to GitHub...
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/%username%/gabonfind.git

echo.
echo Step 4: Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push -u origin master

echo.
echo ========================================
echo         SUCCESS! Project pushed to GitHub
echo ========================================
echo.
echo Your repository: https://github.com/%username%/gabonfind
echo.
echo Next steps:
echo 1. Go to https://netlify.com
echo 2. "Add new site" → "Import existing project"
echo 3. Connect your GitHub repository
echo 4. Deploy!
echo.
echo Your live site will be: https://gabonfind.netlify.app
echo.
pause