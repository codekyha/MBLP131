@echo off
rem Double-click launcher for Deploy-LabVM.ps1 (no execution-policy changes needed).
pushd "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Deploy-LabVM.ps1 -NoPause %*
set RC=%ERRORLEVEL%
echo.
echo Finished with exit code %RC%.
popd
pause
exit /b %RC%
