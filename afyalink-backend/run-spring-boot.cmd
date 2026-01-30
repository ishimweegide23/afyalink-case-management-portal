@echo off
cd /d "%~dp0"
set "MAVEN_OPTS=-Xms32m -Xmx128m -XX:+UseSerialGC"
echo Starting Spring Boot with low-memory JVM settings...
mvn spring-boot:run %*
