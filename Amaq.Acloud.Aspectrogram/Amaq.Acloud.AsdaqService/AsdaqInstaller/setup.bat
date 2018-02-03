@echo off
:: Setup AsdaqViewer
:: A-MAQ S.A.

:: Abrir directorio actual
set currentDirectory=%~dp0
cd /d %currentDirectory%

:: Variables de instalacion
set mongoPath=D:\Mongo
set netFrameworkPath=%windir%\Microsoft.NET\Framework64\v4.0.30319

:: Variables para IIS
set iisPub=C:\inetpub\wwwroot\
set servicesDirectory=Amaq.Acloud.ServicesForHMI
set servicesProtocol=http
set servicesPort=44490
set aspectrogramDirectory=Amaq.Acloud.AspectrogramForHMI
set aspectrogramProtocol=http
set aspectrogramPort=58088

:: Variables restaurar Mongo
set pathRestoreDb=%currentDirectory%\DB
set hostName=localhost
set portNumber=23015

goto CHECK_ARCHITECTURE

:CHECK_ARCHITECTURE
wmic OS get OSArchitecture | find "32" > NUL
if %ERRORLEVEL% == 0 goto NOT64
goto VALIDATE_NF4

:NOT64
echo --------------------------------------------------------------------------------
echo El sistema operativo es de 32 bits
echo Se requiere sistema operativo de 64 bits
echo Saliendo de la instalacion de Aspectrogram...
echo --------------------------------------------------------------------------------
goto END

:VALIDATE_NF4
:: Realizar la busqueda del archivo de configuracion, caso no exista, el usuario no tiene el .Net Framework 4.5 o superior
echo --------------------------------------------------------------------------------
echo 1. Validando Microsoft(c) .NET Framework
echo --------------------------------------------------------------------------------
if exist %netFrameworkPath%\Config goto CHECK_OS

:: Temporalmente no se incluye ni .NET Framework 4.5, ni National Instruments
echo Este Script no incluye la instalacion de .NET Framework 4.5 ni National Instruments
echo Favor contacte a A-MAQ S.A. para ofrecer soporte al respecto
echo --------------------------------------------------------------------------------
goto END

:CHECK_OS
echo Microsoft(c) .NET Framework 4.5 o superior instalado
wmic os get caption | find "Windows Server" > NUL
if %ERRORLEVEL% == 0 goto SERVER_MGR
goto INSTALL_VCPLUS

:SERVER_MGR
:: Aplica unicamente para Windows Server
servermanagercmd  -install Web-Server > NUL
goto INSTALL_VCPLUS

:INSTALL_VCPLUS
start /wait DotNetFX451\vcredist_x64-2015 /passive /norestart
goto INSTALL_VCPLUS2013

:INSTALL_VCPLUS2013
start /wait DotNetFX451\vcredist_x64-2013 /passive /norestart
goto ACTIVATE_IIS

:ACTIVATE_IIS
:: Realizar la activacion de Internet Information Service
echo --------------------------------------------------------------------------------
echo 2. Activando el servicio de informacion de internet IIS, por favor espere...
echo --------------------------------------------------------------------------------
start /w pkgmgr /iu:IIS-WebServerRole;IIS-WebServer;IIS-CommonHttpFeatures;IIS-StaticContent;IIS-DefaultDocument;IIS-DirectoryBrowsing;IIS-HttpErrors;IIS-HttpRedirect;IIS-ApplicationDevelopment;IIS-ASPNET;IIS-NetFxExtensibility;IIS-ASPNET45;IIS-NetFxExtensibility45;IIS-ASP;IIS-CGI;IIS-ISAPIExtensions;IIS-ISAPIFilter;IIS-ServerSideIncludes;IIS-HealthAndDiagnostics;IIS-HttpLogging;IIS-LoggingLibraries;IIS-RequestMonitor;IIS-HttpTracing;IIS-CustomLogging;IIS-Security;IIS-BasicAuthentication;IIS-URLAuthorization;IIS-RequestFiltering;IIS-IPSecurity;IIS-Performance;IIS-HttpCompressionStatic;IIS-HttpCompressionDynamic;IIS-WebServerManagementTools;IIS-ManagementConsole;IIS-ManagementScriptingTools;IIS-ManagementService;IIS-IIS6ManagementCompatibility;IIS-Metabase;IIS-WMICompatibility;IIS-LegacyScripts;IIS-LegacySnapIn;WAS-WindowsActivationService;WAS-ProcessModel;WAS-NetFxEnvironment;WAS-ConfigurationAPI > NUL
dism /online /enable-feature /featureName:IIS-ASPNET45 /ALL

if %ERRORLEVEL% == 0 (
  :: Registro de .NET Framework sin modificar la version de CLR asociada a los grupos de aplicaciones existentes
  %netFrameworkPath%\aspnet_regiis -ir -enable > NUL
  goto INSTALL_MONGO
)

echo --------------------------------------------------------------------------------
echo No fue posible activar uno o varias caracteristicas IIS
echo Favor contacte a A-MAQ S.A. para ofrecer soporte al respecto
echo --------------------------------------------------------------------------------
:: Aqui se verifica cual fue el del error
goto END

:INSTALL_MONGO
:: Instalacion de MongoDB
echo --------------------------------------------------------------------------------
echo 3. Instalando el servidor de bases de datos MongoDB, por favor espere...
echo --------------------------------------------------------------------------------
call msiexec /i "%currentDirectory%\Mongo\mongodb-win32-x86_64-2008plus-ssl-3.4.2-signed.msi" /q INSTALLLOCATION="%mongoPath%\mongodb\" ADDLOCAL="all" /L*v  "%TEMP%\mongoInstalation.log"
echo Codigo retornado: %ERRORLEVEL%

:: Iniciar loop para verificar que ya se instalo 
goto LOOP

:LOOP
if exist "%mongoPath%\mongodb\bin\mongo.exe" goto ADD_PATH
timeout 2
goto LOOP

:ADD_PATH
:: Agregamos la variable al PATH del sistema
if "%PATH%" == "" goto NOPATH

:: Antes de agregar al PATH verificamos si previamente no existe para no repetirlo
mongo --help 1>NUL 2>NUL
IF ERRORLEVEL 9009 GOTO YESPATH
:: Caso ya exista previamente la variable de entorno procedemos con la instalacion del servicio MongoDB
goto MONGO_SERVICE

:YESPATH
echo Se agregara al path existente
setx PATH "%PATH%;%mongoPath%\mongodb\bin"
goto MONGO_SERVICE

:NOPATH
echo No existe actualmente path
setx PATH "%mongoPath%\mongodb\bin;"
goto MONGO_SERVICE

:MONGO_SERVICE
:: Verificamos si el servicio ya existe previamente
sc query MongoDB > NUL
if ERRORLEVEL 1060 GOTO CREATE_SERVICE
goto REMOVE_SERVICE

:REMOVE_SERVICE
:: Detenemos el servicio MongoDB si esta corriendo
net stop MongoDB > NUL
timeout 5 > NUL

:: Eliminamos el servicio MongoDB y sus archivos de base de datos
%mongoPath%\mongodb\bin\mongod --serviceName "MongoDB" --remove > NUL
echo %ERRORLEVEL%

goto CREATE_SERVICE

:CREATE_SERVICE
rmdir %mongoPath%\data\ /S /Q
mkdir %mongoPath%\data\
mkdir %mongoPath%\data\db
mkdir %mongoPath%\data\log

:: Copiamos el archivo de configuracion
xcopy /Y Mongo\mongod.cfg %mongoPath%\mongodb\mongod.cfg* > NUL

:: Creamos nuevamente el servicio MongoDB de cero
echo --------------------------------------------------------------------------------
echo 4. Creando servicio de MongoDB
echo --------------------------------------------------------------------------------
%mongoPath%\mongodb\bin\mongod --config %mongoPath%\mongodb\mongod.cfg --serviceName "MongoDB" --serviceDisplayName "MongoDB Server" --install
echo El servicio MongoDB Server fue creado correctamente

:: Esperamos 5 segundos antes de iniciar nuevamente el servicio de MongoDB
timeout 5 > NUL
net start MongoDB > NUL
goto CREATE_SITES

:CREATE_SITES
echo --------------------------------------------------------------------------------
echo 5. Creando sitios Web
echo --------------------------------------------------------------------------------

:: Copiamos los archivos de los Servicios de Acloud en el directorio IIS
xcopy %servicesDirectory% "%iisPub%%servicesDirectory%" /O /X /E /H /K /I /Y > NUL
:: Copiamos los archivos de Aspectrogram en el directorio IIS
xcopy %aspectrogramDirectory% "%iisPub%%aspectrogramDirectory%" /O /X /E /H /K /I /Y > NUL

:: Borrar los sitios (caso existan previamente)
%systemroot%\system32\inetsrv\appcmd delete site "%servicesDirectory%" > NUL
%systemroot%\system32\inetsrv\appcmd delete site "%aspectrogramDirectory%" > NUL

:: Crear Appication Pool para Amaq.Acloud.ServicesForHMI
%systemroot%\system32\inetsrv\appcmd add apppool /name:"%servicesDirectory%" /managedRuntimeVersion:"v4.0" > NUL
%systemroot%\system32\inetsrv\appcmd set config -section:applicationPools "/[name='%servicesDirectory%'].processModel.loadUserProfile:false" > NUL

:: Crear Amaq.Acloud.ServicesForHMI en IIS
%systemroot%\system32\inetsrv\appcmd add site /name:"%servicesDirectory%" /physicalPath:"%iisPub%%servicesDirectory%" /bindings:%servicesProtocol%/*:%servicesPort%: > NUL
%systemroot%\system32\inetsrv\appcmd set app "%servicesDirectory%/" /applicationPool:"%servicesDirectory%" > NUL

:: Crear Appication Pool para Amaq.Acloud.AspectrogramForHMI
%systemroot%\system32\inetsrv\appcmd add apppool /name:"%aspectrogramDirectory%" /managedRuntimeVersion:"v4.0" > NUL
%systemroot%\system32\inetsrv\appcmd set config -section:applicationPools "/[name='%aspectrogramDirectory%'].processModel.loadUserProfile:false" > NUL

:: Crear Amaq.Acloud.AspectrogramForHMI en IIS
%systemroot%\system32\inetsrv\appcmd add site /name:"%aspectrogramDirectory%" /physicalPath:"%iisPub%%aspectrogramDirectory%" /bindings:%aspectrogramProtocol%/*:%aspectrogramPort%: > NUL
%systemroot%\system32\inetsrv\appcmd set app "%aspectrogramDirectory%/" /applicationPool:"%aspectrogramDirectory%" > NUL

:: Iniciar los sitios Amaq.Acloud.ServicesForHMI y Amaq.Acloud.AspectrogramForHMI
%SystemRoot%\system32\inetsrv\appcmd start site "%servicesDirectory%" > NUL
%SystemRoot%\system32\inetsrv\appcmd start site "%aspectrogramDirectory%" > NUL

echo Sitios Web creados correctamente

goto RESTORE_DB

:RESTORE_DB
:: Restaurar base de datos de Administracion
echo --------------------------------------------------------------------------------
echo 7. Restaurando base de datos Administracion
%mongoPath%\mongodb\bin\mongorestore --host %hostName% --port %portNumber% --db administration "%pathRestoreDb%\administration" 1>NUL 2>NUL
echo --------------------------------------------------------------------------------

:: Restaurar base de datos de HMI
echo --------------------------------------------------------------------------------
echo 8. Restaurando base de datos HMI
%mongoPath%\mongodb\bin\mongorestore --host %hostName% --port %portNumber% --db hmi "%pathRestoreDb%\hmi" 1>NUL 2>NUL
echo --------------------------------------------------------------------------------

goto INSTALL_ASD

:INSTALL_ASD
:: Verificamos si el servicio ya existe previamente
sc query "Asdaq Service" > NUL
if ERRORLEVEL 1060 GOTO CREATE_SERVICE
goto REMOVE_SERVICE

:REMOVE_SERVICE
:: Detenemos el servicio "Asdaq Service" si esta corriendo
net stop "Asdaq Service"
timeout 5 > NUL

:: Eliminamos el servicio
cd /d "C:\Program Files\AMAQ\Asdaq Service"
%windir%\Microsoft.NET\Framework64\v4.0.30319\InstallUtil /u Amaq.Acloud.AsdaqService.exe > NUL
echo --------------------------------------------------------------------------------
echo 9. El servicio Asdaq fue removido de la lista de servicios
echo --------------------------------------------------------------------------------
goto CREATE_SERVICE

:CREATE_SERVICE
:: Abrimos el directorio actual
cd /d %currentDirectory%

:: Eliminamos la carpeta (caso exista)
rmdir "C:\Program Files\AMAQ\Asdaq Service" /S /Q

:: Creamos la carpeta de Asdaq en el sistema
md "C:\Program Files\AMAQ\Asdaq Service"

:: Copiamos los archivos del Asdaq en el directorio del sistema destino
xcopy "Asdaq Service" "C:\Program Files\AMAQ\Asdaq Service" /O /X /E /H /K > NUL
cd /d "C:\Program Files\AMAQ\Asdaq Service"

:: Abrimos el directorio de instalacion de Asdaq
%windir%\Microsoft.NET\Framework64\v4.0.30319\InstallUtil Amaq.Acloud.AsdaqService.exe > NUL
echo --------------------------------------------------------------------------------
echo 10. El servicio Asdaq fue creado correctamente
echo --------------------------------------------------------------------------------

goto REMOVE_SLEEP

:REMOVE_SLEEP
:: Eliminamos las diferentes combinaciones para las cuales el equipo entra en estado SLEEP
echo --------------------------------------------------------------------------------
echo 11. Cambiando la configuracion de hibernacion del equipo
echo --------------------------------------------------------------------------------

:: Require a password on wakeup
powercfg -setacvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e fea3413e-7e05-4911-9a71-700331f1c294 0e796bdb-100d-47d6-a2d5-f7d2daa51f51 0
powercfg -setdcvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e fea3413e-7e05-4911-9a71-700331f1c294 0e796bdb-100d-47d6-a2d5-f7d2daa51f51 0

:: Turn off hard disk
powercfg -setacvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 0012ee47-9041-4b5d-9b77-535fba8b1442 6738e2c4-e8a5-4a42-b16a-e040e769756e 0
powercfg -setdcvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 0012ee47-9041-4b5d-9b77-535fba8b1442 6738e2c4-e8a5-4a42-b16a-e040e769756e 0

:: Sleep after
powercfg -setacvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 238c9fa8-0aad-41ed-83f4-97be242c8f20 29f6c1db-86da-48c5-9fdb-f2b67b1f44da 0
powercfg -setdcvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 238c9fa8-0aad-41ed-83f4-97be242c8f20 29f6c1db-86da-48c5-9fdb-f2b67b1f44da 0

:: Allow hybrid sleep
powercfg -setacvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 238c9fa8-0aad-41ed-83f4-97be242c8f20 94ac6d29-73ce-41a6-809f-6363ba21b47e 0
powercfg -setdcvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 238c9fa8-0aad-41ed-83f4-97be242c8f20 94ac6d29-73ce-41a6-809f-6363ba21b47e 0

:: Hibernate after
powercfg -setacvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 238c9fa8-0aad-41ed-83f4-97be242c8f20 9d7815a6-7ee4-497e-8888-515a05f02364 0
powercfg -setdcvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 238c9fa8-0aad-41ed-83f4-97be242c8f20 9d7815a6-7ee4-497e-8888-515a05f02364 0

:: Allow wake timers
powercfg -setacvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 238c9fa8-0aad-41ed-83f4-97be242c8f20 bd3b718a-0680-4d9d-8ab2-e1d2b4ac806d 0
powercfg -setdcvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 238c9fa8-0aad-41ed-83f4-97be242c8f20 bd3b718a-0680-4d9d-8ab2-e1d2b4ac806d 0

:: USB selective suspend setting
powercfg -setacvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg -setdcvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0

:: Turn off display after
powercfg -setacvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 7516b95f-f776-4464-8c53-06167f40cc99 3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e 0
powercfg -setdcvalueindex 381b4222-f694-41f0-9685-ff5bb260df2e 7516b95f-f776-4464-8c53-06167f40cc99 3c0bc021-c8a8-4e07-a973-6b14cbcb2b7e 0

goto OPEN_IIS

:::START_SERVICE
:::: Iniciamos el servicio Asdaq
::net start "Asdaq Service"

:OPEN_IIS
:: Abrir el Administrador de Internet Information Services (IIS)
start inetmgr
goto START_ASDAQVW

:START_ASDAQVW
cd /d %currentDirectory%
echo --------------------------------------------------------------------------------
echo 12. Instalado correctamente
echo --------------------------------------------------------------------------------
goto END

:END
pause
echo on
exit