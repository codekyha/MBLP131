@echo off
rem Double-click launcher for Install-LabWSL.ps1 (no execution-policy changes needed).
rem Installs "Ubuntu Lab": Ubuntu 24.04 on WSL 2 with Docker, the Python/AI stack and the course tools, plus a desktop shortcut.
rem Options: see README.md, section "WSL 2 route" (for example:  Install-LabWSL.cmd -Extras cloud,k8s,models -MemoryGB 16).
title Ubuntu Lab - install
pushd "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install-LabWSL.ps1 -NoPause %*
set RC=%ERRORLEVEL%
echo.
echo Finished with exit code %RC%.
popd
pause
exit /b %RC%
