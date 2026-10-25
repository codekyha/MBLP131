@echo off
rem Double-click launcher: runs the kit installer again inside the existing "Ubuntu Lab" (new kit version, repair, new course material
rem such as the operating-systems code base). Same as  Install-LabWSL.cmd -Update  ; other options can be added, e.g.  Update-LabWSL.cmd -Extras cloud
title Ubuntu Lab - update
pushd "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install-LabWSL.ps1 -NoPause -Update %*
set RC=%ERRORLEVEL%
echo.
echo Finished with exit code %RC%.
popd
pause
exit /b %RC%
