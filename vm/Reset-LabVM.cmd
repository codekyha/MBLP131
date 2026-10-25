@echo off
rem Replaces this machine's lab VM with a fresh copy made from the VDI. Everything stored inside the old VM is lost.
title MCMP117 lab VM - reset
pushd "%~dp0"
echo.
echo This DELETES the existing lab VM on this computer and creates a fresh one from the VDI.
echo Close this window now to cancel. Continuing in 10 seconds ...
timeout /t 10
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Deploy-LabVM.ps1 -Force -NoPause %*
set RC=%ERRORLEVEL%
echo.
echo Finished with exit code %RC%.
popd
pause
exit /b %RC%
