import { UnauthorizedError } from "../utils/errors.js";

export const authenticate = async (request) => {
  try {
    const decodedToken = await request.jwtVerify();

    request.user = {
      id: decodedToken.sub,
      email: decodedToken.email,
    };
  } catch {
    throw new UnauthorizedError("Missing or invalid token");
  }
};
