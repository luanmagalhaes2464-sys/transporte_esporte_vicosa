import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/modules/audit/service";

export async function assignVehicle(input: { tripId: string; vehicleId: string; actorUserId: string }) {
  const row = await prisma.$transaction(async tx => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: input.tripId } });
    const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: input.vehicleId } });
    if (!vehicle.active || !["AVAILABLE", "ON_TRIP"].includes(vehicle.status)) throw new Error("VEHICLE_UNAVAILABLE");
    if (vehicle.capacity < trip.passengerCount) throw new Error("VEHICLE_CAPACITY");
    const conflict = await tx.tripVehicleAssignment.findFirst({ where: {
      vehicleId: input.vehicleId, active: true, tripId: { not: trip.id },
      trip: { status: { not: "CANCELED" }, startAt: { lt: trip.endAt }, endAt: { gt: trip.startAt } }
    }, include: { trip: true } });
    if (conflict) throw new Error("VEHICLE_CONFLICT");
    await tx.tripVehicleAssignment.updateMany({ where: { tripId: trip.id, active: true }, data: { active: false } });
    const assignment = await tx.tripVehicleAssignment.create({ data: { tripId: trip.id, vehicleId: vehicle.id, assignedBy: input.actorUserId } });
    if (trip.extraRequestId) await tx.extracurricularRequest.updateMany({ where: { id: trip.extraRequestId, status: { in: ["APPROVED", "VEHICLE_DEFINED"] } }, data: { status: "VEHICLE_DEFINED" } });
    return assignment;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  await audit({ actorUserId: input.actorUserId, action: "ASSIGN", entityType: "trip_vehicle", entityId: row.id, changedFields: ["vehicleId"] });
  return row;
}

export async function assignDriver(input: { tripId: string; driverId: string; actorUserId: string }) {
  const row = await prisma.$transaction(async tx => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: input.tripId } });
    const driver = await tx.driver.findUniqueOrThrow({ where: { id: input.driverId } });
    if (!driver.active || driver.status !== "ACTIVE" || driver.cnhExpiry < trip.endAt) throw new Error("DRIVER_UNAVAILABLE");
    const conflict = await tx.tripDriverAssignment.findFirst({ where: {
      driverId: input.driverId, active: true, tripId: { not: trip.id },
      trip: { status: { not: "CANCELED" }, startAt: { lt: trip.endAt }, endAt: { gt: trip.startAt } }
    } });
    if (conflict) throw new Error("DRIVER_CONFLICT");
    await tx.tripDriverAssignment.updateMany({ where: { tripId: trip.id, active: true }, data: { active: false } });
    const assignment = await tx.tripDriverAssignment.create({ data: { tripId: trip.id, driverId: driver.id, assignedBy: input.actorUserId } });
    if (trip.extraRequestId) await tx.extracurricularRequest.updateMany({ where: { id: trip.extraRequestId, status: { in: ["VEHICLE_DEFINED", "DRIVER_DEFINED"] } }, data: { status: "DRIVER_DEFINED" } });
    return assignment;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  await audit({ actorUserId: input.actorUserId, action: "ASSIGN", entityType: "trip_driver", entityId: row.id, changedFields: ["driverId"] });
  return row;
}
