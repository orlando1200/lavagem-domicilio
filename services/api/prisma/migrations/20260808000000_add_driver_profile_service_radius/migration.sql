-- Migration: add_driver_profile_service_radius
-- `20260806000000_unify_washer_into_driver_profile` dropou a tabela
-- `washers` (que tinha `service_radius_km`) mas nunca adicionou essa
-- coluna em `driver_profiles`, apesar de `schema.prisma` continuar
-- esperando `DriverProfile.serviceRadiusKm` (@map("service_radius_km")).
-- So foi possivel descobrir esse drift agora, na primeira vez que o
-- backend rodou de ponta a ponta contra um Postgres real: qualquer
-- query que tocasse `DriverProfile` (ex.: `GET /users/me` via include
-- de driverProfile) quebrava com
-- "column driver_profiles.service_radius_km does not exist".

ALTER TABLE "driver_profiles" ADD COLUMN "service_radius_km" DECIMAL(6,2) NOT NULL DEFAULT 5;
