import { AuthPayload } from "../../shared/types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
