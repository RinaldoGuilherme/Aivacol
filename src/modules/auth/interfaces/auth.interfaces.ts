/** Shape of the signed JWT payload. */
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

/** Authenticated principal attached to request.user by the JwtStrategy. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}
