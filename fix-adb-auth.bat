@echo off
echo 🔧 CORRECTION DES PROBLEMES D'AUTORISATION ADB
echo ================================================
echo.

echo 📱 Etape 1: Arret du serveur ADB...
bin\platform-tools\adb.exe kill-server
echo ✅ Serveur ADB arrete

echo.
echo 📱 Etape 2: Redemarrage du serveur ADB...
bin\platform-tools\adb.exe start-server
echo ✅ Serveur ADB redemarré

echo.
echo 📱 Etape 3: Verification des appareils...
bin\platform-tools\adb.exe devices
echo.

echo 💡 INSTRUCTIONS IMPORTANTES:
echo =============================
echo 1. Regardez votre telephone Android
echo 2. Une popup "Autoriser le debogage USB" devrait apparaitre
echo 3. Cochez "Toujours autoriser depuis cet ordinateur"
echo 4. Appuyez sur "OK" ou "Autoriser"
echo 5. Relancez: bin\platform-tools\adb.exe devices
echo.

echo 🔄 Si le probleme persiste:
echo - Deconnectez et reconnectez le cable USB
echo - Desactivez puis reactivez le debogage USB
echo - Changez le mode USB vers "Transfert de fichiers"
echo.

pause 