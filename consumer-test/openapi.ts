import { openApiSpec as sdkOpenApiSpec } from "../src/playground/openapi.js";

export const consumerOpenApiSpec = {
  ...sdkOpenApiSpec,
  info: {
    ...sdkOpenApiSpec.info,
    title: "Payscribe SDK Consumer Test",
    description:
      "Swagger UI for testing the published @payscribe/sdk package through this consumer Express server."
  },
  servers: [{ url: `http://localhost:${process.env.PORT ?? 4001}` }],
  paths: Object.fromEntries(
    Object.entries(sdkOpenApiSpec.paths).map(([path, operation]) => [
      path.replace(/^\/api/, ""),
      operation
    ])
  )
};
