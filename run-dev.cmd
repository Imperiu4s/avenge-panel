@echo off
SET "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
call npm run dev
