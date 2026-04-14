export function bboxCenter(bbox: [number, number, number, number]): [number, number] {
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

const EARTH_RADIUS_METERS = 6_371_000;

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine distance between two points in meters.
 */
export function haversineDistance(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const deltaLatitude = degreesToRadians(latitude2 - latitude1);
  const deltaLongitude = degreesToRadians(longitude2 - longitude1);
  const radianLatitude1 = degreesToRadians(latitude1);
  const radianLatitude2 = degreesToRadians(latitude2);

  const halfChordSquared =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(radianLatitude1) *
      Math.cos(radianLatitude2) *
      Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(halfChordSquared));
}

/**
 * Minimum distance in meters from a point to a line segment defined by two endpoints.
 * All inputs are [longitude, latitude] (GeoJSON order).
 */
export function pointToSegmentDistance(
  point: [number, number],
  segmentStart: [number, number],
  segmentEnd: [number, number],
): number {
  const distanceToStart = haversineDistance(
    point[1],
    point[0],
    segmentStart[1],
    segmentStart[0],
  );
  const distanceToEnd = haversineDistance(
    point[1],
    point[0],
    segmentEnd[1],
    segmentEnd[0],
  );
  const segmentLength = haversineDistance(
    segmentStart[1],
    segmentStart[0],
    segmentEnd[1],
    segmentEnd[0],
  );

  if (segmentLength === 0) return distanceToStart;

  // Project point onto segment using dot product in a local flat-earth approximation
  const deltaLongitude = segmentEnd[0] - segmentStart[0];
  const deltaLatitude = segmentEnd[1] - segmentStart[1];
  const pointDeltaLongitude = point[0] - segmentStart[0];
  const pointDeltaLatitude = point[1] - segmentStart[1];

  const projectionFactor =
    (pointDeltaLongitude * deltaLongitude + pointDeltaLatitude * deltaLatitude) /
    (deltaLongitude * deltaLongitude + deltaLatitude * deltaLatitude);

  if (projectionFactor <= 0) return distanceToStart;
  if (projectionFactor >= 1) return distanceToEnd;

  const projectedLongitude = segmentStart[0] + projectionFactor * deltaLongitude;
  const projectedLatitude = segmentStart[1] + projectionFactor * deltaLatitude;

  return haversineDistance(point[1], point[0], projectedLatitude, projectedLongitude);
}

/**
 * Minimum distance in meters from a position to a trail polyline.
 * lineCoordinates are in GeoJSON order [longitude, latitude].
 */
export function distanceFromTrail(
  position: { latitude: number; longitude: number },
  lineCoordinates: [number, number][],
): number {
  if (lineCoordinates.length === 0) return Infinity;
  if (lineCoordinates.length === 1) {
    return haversineDistance(
      position.latitude,
      position.longitude,
      lineCoordinates[0][1],
      lineCoordinates[0][0],
    );
  }

  let minimumDistance = Infinity;
  const point: [number, number] = [position.longitude, position.latitude];

  for (let index = 0; index < lineCoordinates.length - 1; index++) {
    const distance = pointToSegmentDistance(
      point,
      lineCoordinates[index],
      lineCoordinates[index + 1],
    );
    if (distance < minimumDistance) {
      minimumDistance = distance;
    }
  }

  return minimumDistance;
}

/**
 * Progress along a trail in km (distance from start, projected onto the trail).
 * lineCoordinates are in GeoJSON order [longitude, latitude].
 */
export function progressAlongTrail(
  position: { latitude: number; longitude: number },
  lineCoordinates: [number, number][],
): number {
  if (lineCoordinates.length < 2) return 0;

  const point: [number, number] = [position.longitude, position.latitude];
  let closestSegmentIndex = 0;
  let closestDistance = Infinity;
  let closestProjectionFactor = 0;

  for (let index = 0; index < lineCoordinates.length - 1; index++) {
    const segmentStart = lineCoordinates[index];
    const segmentEnd = lineCoordinates[index + 1];
    const segmentLength = haversineDistance(
      segmentStart[1],
      segmentStart[0],
      segmentEnd[1],
      segmentEnd[0],
    );

    if (segmentLength === 0) continue;

    const deltaLongitude = segmentEnd[0] - segmentStart[0];
    const deltaLatitude = segmentEnd[1] - segmentStart[1];
    const pointDeltaLongitude = point[0] - segmentStart[0];
    const pointDeltaLatitude = point[1] - segmentStart[1];

    let projectionFactor =
      (pointDeltaLongitude * deltaLongitude + pointDeltaLatitude * deltaLatitude) /
      (deltaLongitude * deltaLongitude + deltaLatitude * deltaLatitude);

    projectionFactor = Math.max(0, Math.min(1, projectionFactor));

    const projectedLongitude = segmentStart[0] + projectionFactor * deltaLongitude;
    const projectedLatitude = segmentStart[1] + projectionFactor * deltaLatitude;
    const distance = haversineDistance(
      point[1],
      point[0],
      projectedLatitude,
      projectedLongitude,
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestSegmentIndex = index;
      closestProjectionFactor = projectionFactor;
    }
  }

  // Sum segment lengths up to the closest segment
  let totalDistanceMeters = 0;
  for (let index = 0; index < closestSegmentIndex; index++) {
    totalDistanceMeters += haversineDistance(
      lineCoordinates[index][1],
      lineCoordinates[index][0],
      lineCoordinates[index + 1][1],
      lineCoordinates[index + 1][0],
    );
  }

  // Add partial distance within the closest segment
  const closestSegmentStart = lineCoordinates[closestSegmentIndex];
  const closestSegmentEnd = lineCoordinates[closestSegmentIndex + 1];
  const closestSegmentLength = haversineDistance(
    closestSegmentStart[1],
    closestSegmentStart[0],
    closestSegmentEnd[1],
    closestSegmentEnd[0],
  );
  totalDistanceMeters += closestProjectionFactor * closestSegmentLength;

  return totalDistanceMeters / 1000;
}
