@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\OpenPromptCMS.ps1" %*

endlocal
