/** Vehicle domain event names, using dot notation as per conventions. */
export const VEHICLE_EVENTS = {
  CREATED: 'vehicle.created',
  UPDATED: 'vehicle.updated',
  DELETED: 'vehicle.deleted',
} as const;

export type VehicleEventName =
  (typeof VEHICLE_EVENTS)[keyof typeof VEHICLE_EVENTS];

/**
 * Action actor attached to every domain event. Only non-sensitive identity
 * fields are included — never password, hashes, tokens or credentials.
 */
export interface EventActor {
  id: number;
  nickname: string;
  name: string;
  email: string;
  role: string;
}

/** Non-sensitive snapshot of the vehicle carried by the event. */
export interface VehicleEventPayload {
  licensePlate: string;
  model: string | null;
  brand: string | null;
}

/** Contract of the message published to the `vehicle_events` queue. */
export interface VehicleEvent {
  event: VehicleEventName;
  entity: 'vehicle';
  entityId: number;
  actor: EventActor;
  payload: VehicleEventPayload;
}
