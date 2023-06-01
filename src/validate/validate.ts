import { Options } from "ajv";
import { createAjv as createDefaultAjv } from "@/renderers/util/validator";
import { ajvKeywords } from "./keywords";

export const createAjv = () => {
  const options: Options = {
    $data: true,
    discriminator: true,
    removeAdditional: true,
  };

  const ajv = createDefaultAjv(options);
  ajvKeywords(ajv);

  return ajv;
};
