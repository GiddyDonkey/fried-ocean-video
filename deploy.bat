@echo off
set PROJ=C:\Users\jason\OneDrive\Desktop\All Things\Personal\Fried Ocean\Image generator\fried-ocean-video-generator\fried-ocean
copy /Y "%~dp0vercel.json" "%PROJ%\vercel.json"
cd /d "%PROJ%"
git add .
git commit -m "fix CSP allow inline scripts"
git push
echo Done! Wait 30 seconds then Ctrl+Shift+R
pause
