import cors, { CorsOptions } from "cors";
import { RequestHandler } from "express";
import { appConfig } from "../config/index.js";

const enableCors = (): RequestHandler => {
  return (req, res, next) => {
    const corsOptions: CorsOptions = {
      origin: appConfig.CORS_ALLOWED_ORIGINS,
      credentials: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      allowedHeaders: "Content-Type, Authorization",
    };
    return cors(corsOptions)(req, res, next);
  };
};

export default enableCors;
