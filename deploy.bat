@echo off
set PROJ=C:\Users\jason\OneDrive\Desktop\All Things\Personal\Fried Ocean\Image generator\fried-ocean-video-generator\fried-ocean
copy /Y "%~dp0index.html" "%PROJ%\index.html"
copy /Y "%~dp0index.html" "%PROJ%\public\index.html"
cd /d "%PROJ%"
git add .
git commit -m "force restore working generator"
git push
echo Done! Wait 30 seconds then hard refresh the page with Ctrl+Shift+R
pause
