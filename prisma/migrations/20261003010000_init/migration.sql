-- Initial schema for Portal Viçosa.
-- Generated from prisma/schema.prisma; no production credentials or citizen data are embedded.


CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

CREATE TYPE "AddressType" AS ENUM ('URBAN', 'RURAL');

CREATE TYPE "LocationSource" AS ENUM ('CEP', 'GEOCODE', 'USER_PIN', 'ADMIN', 'IMPORT');

CREATE TYPE "LocationPrecision" AS ENUM ('EXACT', 'APPROXIMATE', 'NEIGHBORHOOD', 'RURAL_LOCALITY');

CREATE TYPE "NeighborhoodType" AS ENUM ('URBAN', 'RURAL', 'DISTRICT', 'COMMUNITY', 'OTHER');

CREATE TYPE "SchoolTransportPeriodStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED');

CREATE TYPE "SchoolTransportRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING', 'APPROVED', 'DENIED', 'ROUTE_DEFINED', 'ACTIVE', 'CANCELED');

CREATE TYPE "ExtraRequestStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'PENDING', 'APPROVED', 'VEHICLE_DEFINED', 'DRIVER_DEFINED', 'DRIVER_CONFIRMED', 'COMPLETED', 'DENIED', 'CANCELED');

CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'UNAVAILABLE');

CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

CREATE TYPE "TripStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

CREATE TYPE "SportsActivityStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'CANCELED', 'COMPLETED');

CREATE TYPE "SportsRegistrationStatus" AS ENUM ('CONFIRMED', 'CANCELED', 'COMPLETED');

CREATE TYPE "WaitListStatus" AS ENUM ('WAITING', 'CALLED', 'CONFIRMED', 'EXPIRED', 'CANCELED');

CREATE TYPE "NotificationChannel" AS ENUM ('INTERNAL', 'EMAIL', 'WHATSAPP');

CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

CREATE TYPE "DocumentOwnerType" AS ENUM ('SCHOOL_TRANSPORT_REQUEST', 'EXTRA_REQUEST', 'SPORTS_REGISTRATION', 'USER', 'OTHER');

CREATE TYPE "EntityType" AS ENUM ('NEIGHBORHOOD', 'RURAL_LOCALITY', 'STREET', 'DISTRICT');

CREATE TYPE "ExtraActivityType" AS ENUM ('PEDAGOGICAL_VISIT', 'SPORTS_COMPETITION', 'EVENT', 'FAIR', 'CULTURAL_ACTIVITY', 'TECHNICAL_VISIT', 'TOUR', 'OTHER');

CREATE TYPE "VehicleType" AS ENUM ('BUS', 'MINIBUS', 'VAN', 'OTHER');

CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'IMPORT', 'MERGE', 'VIEW_DOCUMENT');

CREATE TABLE "municipalities" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "state" VARCHAR(2) NOT NULL,
  "ibgeCode" TEXT,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "municipalities_ibgeCode_key" UNIQUE ("ibgeCode")
);

CREATE TABLE "system_settings" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "public" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "system_settings_key_key" UNIQUE ("key")
);

CREATE TABLE "persons" (
  "id" UUID NOT NULL,
  "fullName" TEXT NOT NULL,
  "cpf" TEXT,
  "birthDate" TIMESTAMP(3),
  "phone" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "persons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "persons_cpf_key" UNIQUE ("cpf")
);

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "personId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "status" "UserStatus" DEFAULT 'ACTIVE' NOT NULL,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_personId_key" UNIQUE ("personId"),
  CONSTRAINT "users_email_key" UNIQUE ("email")
);

CREATE TABLE "roles" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roles_code_key" UNIQUE ("code")
);

CREATE TABLE "permissions" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "permissions_code_key" UNIQUE ("code")
);

CREATE TABLE "user_roles" (
  "userId" UUID NOT NULL,
  "roleId" UUID NOT NULL,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId", "roleId")
);

CREATE TABLE "role_permissions" (
  "roleId" UUID NOT NULL,
  "permissionId" UUID NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE "students" (
  "id" UUID NOT NULL,
  "personId" UUID NOT NULL,
  "schoolId" UUID,
  "grade" TEXT,
  "shift" TEXT,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "students_personId_key" UNIQUE ("personId")
);

CREATE TABLE "guardians" (
  "id" UUID NOT NULL,
  "personId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "guardians_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guardians_personId_key" UNIQUE ("personId")
);

CREATE TABLE "student_guardians" (
  "studentId" UUID NOT NULL,
  "guardianId" UUID NOT NULL,
  "relation" TEXT,
  "primary" BOOLEAN DEFAULT FALSE NOT NULL,
  CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("studentId", "guardianId")
);

CREATE TABLE "districts" (
  "id" UUID NOT NULL,
  "municipalityId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "neighborhoods" (
  "id" UUID NOT NULL,
  "municipalityId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "type" "NeighborhoodType" DEFAULT 'URBAN' NOT NULL,
  "officialCode" TEXT,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "neighborhoods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rural_localities" (
  "id" UUID NOT NULL,
  "municipalityId" UUID NOT NULL,
  "districtId" UUID,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "popularName" TEXT,
  "region" TEXT,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "locationPrecision" "LocationPrecision",
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rural_localities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "streets" (
  "id" UUID NOT NULL,
  "municipalityId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "cep" TEXT,
  "type" TEXT,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "streets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "street_neighborhoods" (
  "streetId" UUID NOT NULL,
  "neighborhoodId" UUID NOT NULL,
  CONSTRAINT "street_neighborhoods_pkey" PRIMARY KEY ("streetId", "neighborhoodId")
);

CREATE TABLE "location_aliases" (
  "id" UUID NOT NULL,
  "entityType" "EntityType" NOT NULL,
  "entityId" UUID NOT NULL,
  "alias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "location_aliases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "addresses" (
  "id" UUID NOT NULL,
  "personId" UUID,
  "municipalityId" UUID NOT NULL,
  "addressType" "AddressType" NOT NULL,
  "streetId" UUID,
  "neighborhoodId" UUID,
  "districtId" UUID,
  "ruralLocalityId" UUID,
  "cep" TEXT,
  "number" TEXT,
  "complement" TEXT,
  "ruralRoad" TEXT,
  "km" TEXT,
  "referencePoint" TEXT,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "locationSource" "LocationSource",
  "locationPrecision" "LocationPrecision",
  "originalInput" TEXT,
  "verified" BOOLEAN DEFAULT FALSE NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schools" (
  "id" UUID NOT NULL,
  "municipalityId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "addressId" UUID,
  "neighborhoodId" UUID,
  "streetId" UUID,
  "phone" TEXT,
  "director" TEXT,
  "coordinator" TEXT,
  "openingHours" TEXT,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "school_users" (
  "schoolId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  CONSTRAINT "school_users_pkey" PRIMARY KEY ("schoolId", "userId")
);

CREATE TABLE "school_transport_period_schools" (
  "periodId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  CONSTRAINT "school_transport_period_schools_pkey" PRIMARY KEY ("periodId", "schoolId")
);

CREATE TABLE "school_transport_periods" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "requestStart" TIMESTAMP(3) NOT NULL,
  "requestEnd" TIMESTAMP(3) NOT NULL,
  "rules" TEXT,
  "status" "SchoolTransportPeriodStatus" DEFAULT 'DRAFT' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "school_transport_periods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_document_requirements" (
  "id" UUID NOT NULL,
  "periodId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "required" BOOLEAN DEFAULT TRUE NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "transport_document_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "school_transport_requests" (
  "id" UUID NOT NULL,
  "protocol" TEXT NOT NULL,
  "periodId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "addressId" UUID NOT NULL,
  "grade" TEXT,
  "shift" TEXT,
  "entryTime" TEXT,
  "exitTime" TEXT,
  "accessibilityNeed" BOOLEAN DEFAULT FALSE NOT NULL,
  "accessibilityInfo" TEXT,
  "observations" TEXT,
  "status" "SchoolTransportRequestStatus" DEFAULT 'DRAFT' NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "school_transport_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "school_transport_requests_protocol_key" UNIQUE ("protocol")
);

CREATE TABLE "transport_request_history" (
  "id" UUID NOT NULL,
  "requestId" UUID NOT NULL,
  "fromStatus" "SchoolTransportRequestStatus",
  "toStatus" "SchoolTransportRequestStatus" NOT NULL,
  "note" TEXT,
  "changedBy" UUID,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "transport_request_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "extracurricular_requests" (
  "id" UUID NOT NULL,
  "protocol" TEXT NOT NULL,
  "schoolId" UUID NOT NULL,
  "responsibleName" TEXT NOT NULL,
  "responsiblePhone" TEXT NOT NULL,
  "activity" TEXT NOT NULL,
  "purpose" "ExtraActivityType" NOT NULL,
  "purposeOther" TEXT,
  "departureAt" TIMESTAMP(3) NOT NULL,
  "returnAt" TIMESTAMP(3) NOT NULL,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "destinationAddress" TEXT,
  "destinationLatitude" DECIMAL(9,6),
  "destinationLongitude" DECIMAL(9,6),
  "studentCount" INTEGER NOT NULL,
  "companionCount" INTEGER DEFAULT 0 NOT NULL,
  "ageRange" TEXT,
  "accessibilityNeed" BOOLEAN DEFAULT FALSE NOT NULL,
  "observations" TEXT,
  "status" "ExtraRequestStatus" DEFAULT 'REQUESTED' NOT NULL,
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "extracurricular_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "extracurricular_requests_protocol_key" UNIQUE ("protocol")
);

CREATE TABLE "extra_request_history" (
  "id" UUID NOT NULL,
  "requestId" UUID NOT NULL,
  "fromStatus" "ExtraRequestStatus",
  "toStatus" "ExtraRequestStatus" NOT NULL,
  "note" TEXT,
  "changedBy" UUID,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "extra_request_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicles" (
  "id" UUID NOT NULL,
  "identification" TEXT NOT NULL,
  "plate" TEXT NOT NULL,
  "type" "VehicleType" NOT NULL,
  "capacity" INTEGER NOT NULL,
  "accessible" BOOLEAN DEFAULT FALSE NOT NULL,
  "status" "VehicleStatus" DEFAULT 'AVAILABLE' NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vehicles_plate_key" UNIQUE ("plate")
);

CREATE TABLE "drivers" (
  "id" UUID NOT NULL,
  "personId" UUID NOT NULL,
  "cnh" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "cnhExpiry" TIMESTAMP(3) NOT NULL,
  "status" "DriverStatus" DEFAULT 'ACTIVE' NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "drivers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "drivers_personId_key" UNIQUE ("personId"),
  CONSTRAINT "drivers_cnh_key" UNIQUE ("cnh")
);

CREATE TABLE "trips" (
  "id" UUID NOT NULL,
  "extraRequestId" UUID,
  "sportsActivityId" UUID,
  "title" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "passengerCount" INTEGER DEFAULT 0 NOT NULL,
  "responsibleName" TEXT,
  "responsiblePhone" TEXT,
  "status" "TripStatus" DEFAULT 'PLANNED' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trip_vehicle_assignments" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "vehicleId" UUID NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "assignedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "assignedBy" UUID,
  CONSTRAINT "trip_vehicle_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trip_driver_assignments" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "driverId" UUID NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "confirmedAt" TIMESTAMP(3),
  "assignedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "assignedBy" UUID,
  CONSTRAINT "trip_driver_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sports_categories" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sports_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sports_categories_name_key" UNIQUE ("name")
);

CREATE TABLE "sports_activities" (
  "id" UUID NOT NULL,
  "protocolPrefix" TEXT DEFAULT 'ESP' NOT NULL,
  "categoryId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "imageUrl" TEXT,
  "description" TEXT NOT NULL,
  "audience" TEXT,
  "minAge" INTEGER,
  "maxAge" INTEGER,
  "classification" TEXT,
  "locationName" TEXT NOT NULL,
  "addressText" TEXT,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "capacity" INTEGER NOT NULL,
  "registrationStart" TIMESTAMP(3) NOT NULL,
  "registrationEnd" TIMESTAMP(3) NOT NULL,
  "activityStart" TIMESTAMP(3) NOT NULL,
  "activityEnd" TIMESTAMP(3),
  "rulesUrl" TEXT,
  "responsibleName" TEXT,
  "contact" TEXT,
  "offersTransport" BOOLEAN DEFAULT FALSE NOT NULL,
  "transportCapacity" INTEGER,
  "status" "SportsActivityStatus" DEFAULT 'DRAFT' NOT NULL,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sports_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sports_activities_slug_key" UNIQUE ("slug")
);

CREATE TABLE "sports_activity_schedules" (
  "id" UUID NOT NULL,
  "activityId" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT,
  CONSTRAINT "sports_activity_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sports_boarding_points" (
  "id" UUID NOT NULL,
  "activityId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "capacity" INTEGER,
  "active" BOOLEAN DEFAULT TRUE NOT NULL,
  CONSTRAINT "sports_boarding_points_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sports_registrations" (
  "id" UUID NOT NULL,
  "protocol" TEXT NOT NULL,
  "activityId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "participantPersonId" UUID NOT NULL,
  "boardingPointId" UUID,
  "wantsTransport" BOOLEAN DEFAULT FALSE NOT NULL,
  "status" "SportsRegistrationStatus" DEFAULT 'CONFIRMED' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sports_registrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sports_registrations_protocol_key" UNIQUE ("protocol")
);

CREATE TABLE "sports_waiting_lists" (
  "id" UUID NOT NULL,
  "activityId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "participantPersonId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "WaitListStatus" DEFAULT 'WAITING' NOT NULL,
  "calledAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sports_waiting_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents" (
  "id" UUID NOT NULL,
  "ownerType" "DocumentOwnerType" NOT NULL,
  "storageKey" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "sha256" TEXT,
  "createdById" UUID,
  "transportRequestId" UUID,
  "transportRequirementId" UUID,
  "extraRequestId" UUID,
  "sportsRegistrationId" UUID,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "NotificationStatus" DEFAULT 'PENDING' NOT NULL,
  "readAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "actorUserId" UUID,
  "action" "AuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "changedFields" TEXT[] NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "protocol_counters" (
  "id" UUID NOT NULL,
  "namespace" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "value" INTEGER DEFAULT 0 NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "protocol_counters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cep_cache" (
  "cep" TEXT NOT NULL,
  "street" TEXT,
  "neighborhood" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "raw" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cep_cache_pkey" PRIMARY KEY ("cep")
);

CREATE TABLE "geocoding_cache" (
  "id" UUID NOT NULL,
  "queryHash" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "raw" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "geocoding_cache_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "geocoding_cache_queryHash_key" UNIQUE ("queryHash")
);

CREATE UNIQUE INDEX "municipalities_name_state_key" ON "municipalities"("name", "state");

CREATE INDEX "persons_fullName_idx" ON "persons"("fullName");

CREATE UNIQUE INDEX "districts_municipalityId_normalizedName_key" ON "districts"("municipalityId", "normalizedName");

CREATE INDEX "districts_normalizedName_idx" ON "districts"("normalizedName");

CREATE UNIQUE INDEX "neighborhoods_municipalityId_normalizedName_type_key" ON "neighborhoods"("municipalityId", "normalizedName", "type");

CREATE INDEX "neighborhoods_normalizedName_idx" ON "neighborhoods"("normalizedName");

CREATE UNIQUE INDEX "rural_localities_municipalityId_normalizedName_key" ON "rural_localities"("municipalityId", "normalizedName");

CREATE INDEX "rural_localities_normalizedName_idx" ON "rural_localities"("normalizedName");

CREATE UNIQUE INDEX "streets_municipalityId_normalizedName_key" ON "streets"("municipalityId", "normalizedName");

CREATE INDEX "streets_normalizedName_idx" ON "streets"("normalizedName");

CREATE INDEX "location_aliases_entityType_entityId_idx" ON "location_aliases"("entityType", "entityId");

CREATE INDEX "location_aliases_normalizedAlias_idx" ON "location_aliases"("normalizedAlias");

CREATE UNIQUE INDEX "location_aliases_entityType_entityId_normalizedAlias_key" ON "location_aliases"("entityType", "entityId", "normalizedAlias");

CREATE INDEX "addresses_personId_idx" ON "addresses"("personId");

CREATE INDEX "addresses_neighborhoodId_idx" ON "addresses"("neighborhoodId");

CREATE INDEX "addresses_ruralLocalityId_idx" ON "addresses"("ruralLocalityId");

CREATE INDEX "schools_name_idx" ON "schools"("name");

CREATE INDEX "school_transport_period_schools_schoolId_idx" ON "school_transport_period_schools"("schoolId");

CREATE INDEX "school_transport_periods_academicYear_status_idx" ON "school_transport_periods"("academicYear", "status");

CREATE UNIQUE INDEX "school_transport_requests_periodId_studentId_key" ON "school_transport_requests"("periodId", "studentId");

CREATE INDEX "school_transport_requests_periodId_status_idx" ON "school_transport_requests"("periodId", "status");

CREATE INDEX "school_transport_requests_schoolId_status_idx" ON "school_transport_requests"("schoolId", "status");

CREATE INDEX "transport_request_history_requestId_createdAt_idx" ON "transport_request_history"("requestId", "createdAt");

CREATE INDEX "extracurricular_requests_schoolId_departureAt_idx" ON "extracurricular_requests"("schoolId", "departureAt");

CREATE INDEX "extracurricular_requests_status_idx" ON "extracurricular_requests"("status");

CREATE INDEX "drivers_cnhExpiry_idx" ON "drivers"("cnhExpiry");

CREATE INDEX "trips_startAt_endAt_idx" ON "trips"("startAt", "endAt");

CREATE INDEX "trip_vehicle_assignments_vehicleId_active_idx" ON "trip_vehicle_assignments"("vehicleId", "active");

CREATE INDEX "trip_driver_assignments_driverId_active_idx" ON "trip_driver_assignments"("driverId", "active");

CREATE INDEX "sports_activities_status_registrationStart_registrationEnd_idx" ON "sports_activities"("status", "registrationStart", "registrationEnd");

CREATE UNIQUE INDEX "sports_registrations_activityId_participantPersonId_key" ON "sports_registrations"("activityId", "participantPersonId");

CREATE INDEX "sports_registrations_userId_createdAt_idx" ON "sports_registrations"("userId", "createdAt");

CREATE INDEX "sports_registrations_activityId_status_idx" ON "sports_registrations"("activityId", "status");

CREATE UNIQUE INDEX "sports_waiting_lists_activityId_participantPersonId_key" ON "sports_waiting_lists"("activityId", "participantPersonId");

CREATE UNIQUE INDEX "sports_waiting_lists_activityId_position_key" ON "sports_waiting_lists"("activityId", "position");

CREATE INDEX "sports_waiting_lists_activityId_status_position_idx" ON "sports_waiting_lists"("activityId", "status", "position");

CREATE UNIQUE INDEX "documents_transportRequestId_transportRequirementId_key" ON "documents"("transportRequestId", "transportRequirementId");

CREATE INDEX "documents_ownerType_createdAt_idx" ON "documents"("ownerType", "createdAt");

CREATE INDEX "notifications_userId_status_createdAt_idx" ON "notifications"("userId", "status", "createdAt");

CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");

CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");

CREATE UNIQUE INDEX "protocol_counters_namespace_year_key" ON "protocol_counters"("namespace", "year");

ALTER TABLE "users" ADD CONSTRAINT "users_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT "students_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON UPDATE CASCADE;

ALTER TABLE "guardians" ADD CONSTRAINT "guardians_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "districts" ADD CONSTRAINT "districts_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "neighborhoods" ADD CONSTRAINT "neighborhoods_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rural_localities" ADD CONSTRAINT "rural_localities_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rural_localities" ADD CONSTRAINT "rural_localities_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON UPDATE CASCADE;

ALTER TABLE "streets" ADD CONSTRAINT "streets_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "street_neighborhoods" ADD CONSTRAINT "street_neighborhoods_streetId_fkey" FOREIGN KEY ("streetId") REFERENCES "streets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "street_neighborhoods" ADD CONSTRAINT "street_neighborhoods_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "neighborhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_streetId_fkey" FOREIGN KEY ("streetId") REFERENCES "streets"("id") ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "neighborhoods"("id") ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_ruralLocalityId_fkey" FOREIGN KEY ("ruralLocalityId") REFERENCES "rural_localities"("id") ON UPDATE CASCADE;

ALTER TABLE "schools" ADD CONSTRAINT "schools_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "schools" ADD CONSTRAINT "schools_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON UPDATE CASCADE;

ALTER TABLE "schools" ADD CONSTRAINT "schools_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "neighborhoods"("id") ON UPDATE CASCADE;

ALTER TABLE "schools" ADD CONSTRAINT "schools_streetId_fkey" FOREIGN KEY ("streetId") REFERENCES "streets"("id") ON UPDATE CASCADE;

ALTER TABLE "school_users" ADD CONSTRAINT "school_users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_users" ADD CONSTRAINT "school_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_transport_period_schools" ADD CONSTRAINT "school_transport_period_schools_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "school_transport_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_transport_period_schools" ADD CONSTRAINT "school_transport_period_schools_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transport_document_requirements" ADD CONSTRAINT "transport_document_requirements_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "school_transport_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_transport_requests" ADD CONSTRAINT "school_transport_requests_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "school_transport_periods"("id") ON UPDATE CASCADE;

ALTER TABLE "school_transport_requests" ADD CONSTRAINT "school_transport_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON UPDATE CASCADE;

ALTER TABLE "school_transport_requests" ADD CONSTRAINT "school_transport_requests_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON UPDATE CASCADE;

ALTER TABLE "school_transport_requests" ADD CONSTRAINT "school_transport_requests_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON UPDATE CASCADE;

ALTER TABLE "transport_request_history" ADD CONSTRAINT "transport_request_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "school_transport_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "extracurricular_requests" ADD CONSTRAINT "extracurricular_requests_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON UPDATE CASCADE;

ALTER TABLE "extra_request_history" ADD CONSTRAINT "extra_request_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "extracurricular_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drivers" ADD CONSTRAINT "drivers_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trips" ADD CONSTRAINT "trips_extraRequestId_fkey" FOREIGN KEY ("extraRequestId") REFERENCES "extracurricular_requests"("id") ON UPDATE CASCADE;

ALTER TABLE "trips" ADD CONSTRAINT "trips_sportsActivityId_fkey" FOREIGN KEY ("sportsActivityId") REFERENCES "sports_activities"("id") ON UPDATE CASCADE;

ALTER TABLE "trip_vehicle_assignments" ADD CONSTRAINT "trip_vehicle_assignments_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trip_vehicle_assignments" ADD CONSTRAINT "trip_vehicle_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON UPDATE CASCADE;

ALTER TABLE "trip_driver_assignments" ADD CONSTRAINT "trip_driver_assignments_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trip_driver_assignments" ADD CONSTRAINT "trip_driver_assignments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON UPDATE CASCADE;

ALTER TABLE "sports_activities" ADD CONSTRAINT "sports_activities_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "sports_categories"("id") ON UPDATE CASCADE;

ALTER TABLE "sports_activity_schedules" ADD CONSTRAINT "sports_activity_schedules_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "sports_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sports_boarding_points" ADD CONSTRAINT "sports_boarding_points_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "sports_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sports_registrations" ADD CONSTRAINT "sports_registrations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "sports_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sports_registrations" ADD CONSTRAINT "sports_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sports_registrations" ADD CONSTRAINT "sports_registrations_participantPersonId_fkey" FOREIGN KEY ("participantPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sports_registrations" ADD CONSTRAINT "sports_registrations_boardingPointId_fkey" FOREIGN KEY ("boardingPointId") REFERENCES "sports_boarding_points"("id") ON UPDATE CASCADE;

ALTER TABLE "sports_waiting_lists" ADD CONSTRAINT "sports_waiting_lists_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "sports_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sports_waiting_lists" ADD CONSTRAINT "sports_waiting_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sports_waiting_lists" ADD CONSTRAINT "sports_waiting_lists_participantPersonId_fkey" FOREIGN KEY ("participantPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_transportRequestId_fkey" FOREIGN KEY ("transportRequestId") REFERENCES "school_transport_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_transportRequirementId_fkey" FOREIGN KEY ("transportRequirementId") REFERENCES "transport_document_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_extraRequestId_fkey" FOREIGN KEY ("extraRequestId") REFERENCES "extracurricular_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_sportsRegistrationId_fkey" FOREIGN KEY ("sportsRegistrationId") REFERENCES "sports_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON UPDATE CASCADE;
