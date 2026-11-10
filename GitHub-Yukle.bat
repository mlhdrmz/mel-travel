@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   Rotam Turkiye (mel-travel) - GitHub'a Yukleniyor...
echo   Hedef Repo: https://github.com/mlhdrmz/mel-travel.git
echo ============================================================
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/mlhdrmz/mel-travel.git
git push -u origin main
echo.
echo ============================================================
echo   Tamamlandi! Simdi https://vercel.com/new adresinden
echo   mlhdrmz/mel-travel reposunu "Import -> Deploy" yapabilirsin!
echo ============================================================
pause
