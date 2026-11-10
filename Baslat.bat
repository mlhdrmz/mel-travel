@echo off
chcp 65001 >nul
title Rotam Turkiye - Melih Seyahat ve FlightRadar Gunlugu
echo ====================================================================
echo   Rotam Turkiye - Melih'in Seyahat Haritasi ve FlightRadar Gunlugu
echo ====================================================================
echo.
echo [1] Tarayicida dogrudan aciliyor...
start "" "%~dp0src\MelTravel.Web\wwwroot\index.html"
echo.
echo [2] .NET 8 Yerel Sunucu baslatiliyor (http://localhost:5180)...
cd /d "%~dp0src\MelTravel.Web"
dotnet run --urls "http://localhost:5180"
pause
