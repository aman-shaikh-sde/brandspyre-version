import mongoose from "mongoose";

declare global {
  var client: any;
  var session: any;

  namespace Express {
    interface Request {
      user?: any;
      securityContext?: any;
      tenant?: any;
      dataScope?: any;
      rawBody?: Buffer;
    }
  }
}

export {};
