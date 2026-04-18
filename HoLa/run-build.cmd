@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.10"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d D:\ChatPj\HoLa
mvnw.cmd clean package -DskipTests
