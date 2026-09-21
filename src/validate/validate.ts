import { Options } from "ajv";
import { createAjv as createDefaultAjv } from "@/renderers/util/validator";
import { ajvKeywords } from "./keywords";
import ajvErrors from "ajv-errors";
import { markRaw } from "vue";

export const createAjv = () => {
  const options: Options = {
    $data: true,
    discriminator: true,
    removeAdditional: true,
  };

  const ajv = createDefaultAjv(options);
  ajvKeywords(ajv);
  ajvErrors(ajv);

  // ajv mutates itself on compile; as a reactive proxy that causes update loops
  return markRaw(ajv);
};
