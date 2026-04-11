@echo off
set PROJ=C:\Users\jason\OneDrive\Desktop\All Things\Personal\Fried Ocean\Image generator\fried-ocean-video-generator\fried-ocean
copy /Y "%~dp0index.html" "%PROJ%\index.html"
copy /Y "%~dp0index.html" "%PROJ%\public\index.html"
cd /d "%PROJ%"
git add .
git commit -m "white bg, remove ticker"
git push
echo Done! Wait 30 seconds.
pause
