import { JsonFormsRendererRegistryEntry } from "@jsonforms/core";

import { entry as groupRenderer } from "./layouts/GroupRenderer.vue";
import { entry as numberControlRenderer } from "./controls/NumberControlRenderer.vue";
import { entry as stringControlRenderer } from "./controls/StringControlRenderer.vue";
import { entry as multiStringControlRenderer } from "./controls/MultiStringControlRenderer.vue";
import { entry as dateControlRenderer } from "./controls/DateControlRenderer.vue";
import { entry as dateTimeControlRenderer } from "./controls/DateTimeControlRenderer.vue";
import { entry as objectControlRenderer } from "./controls/ObjectControlRenderer.vue";
import { entry as enumControlRenderer } from "./controls/EnumControlRenderer.vue";
import { entry as arrayPrimitiveControlRenderer } from "./array/ArrayPrimitiveControlRenderer.vue";
import { entry as anyOfRenderer } from "./controls/AnyOfRenderer.vue";
import { entry as allOfRenderer } from "./controls/AllOfRenderer.vue";
import { entry as radioGroupControlRenderer } from "./controls/RadioGroupControlRenderer.vue";
import { entry as verticalLayoutRenderer } from "./layouts/VerticalLayoutRenderer.vue";
import { entry as horizontalLayoutRenderer } from "./layouts/HorizontalLayoutRenderer.vue";
import { entry as integerControlRenderer } from "./controls/IntegerControlRenderer.vue";
import { entry as anyOfStringOrEnumControlRenderer } from "./controls/AnyOfStringOrEnumControlRenderer.vue";
import { entry as enumArrayRenderer } from "./controls/EnumArrayRenderer.vue";
import { entry as oneOfRenderer } from "./controls/OneOfRenderer.vue";
import { entry as oneOfEnumControlRenderer } from "./controls/OneOfEnumControlRenderer.vue";
import { entry as arrayLayoutRenderer } from "./layouts/ArrayLayoutRenderer.vue";
import { entry as booleanControlRenderer } from "./controls/BooleanControlRenderer.vue";
import { entry as mapLayoutRenderer } from "./layouts/MapLayoutRenderer.vue";
import { entry as objectLayoutRenderer } from "./layouts/ObjectLayoutRenderer.vue";

export const CzRenderers: JsonFormsRendererRegistryEntry[] = [
  enumControlRenderer,
  enumArrayRenderer,
  arrayPrimitiveControlRenderer,
  groupRenderer,
  numberControlRenderer,
  stringControlRenderer,
  multiStringControlRenderer,
  dateControlRenderer,
  dateTimeControlRenderer,
  objectControlRenderer,
  anyOfRenderer,
  oneOfRenderer,
  oneOfEnumControlRenderer,
  allOfRenderer,
  radioGroupControlRenderer,
  verticalLayoutRenderer,
  horizontalLayoutRenderer,
  mapLayoutRenderer,
  arrayLayoutRenderer,
  integerControlRenderer,
  anyOfStringOrEnumControlRenderer,
  booleanControlRenderer,
  objectLayoutRenderer,
];

export const extendedCzRenderers = [...CzRenderers] as any[];
