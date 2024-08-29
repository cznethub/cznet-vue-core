import {
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
  and,
  hasType,
  isAllOfControl,
  isAnyOfControl,
  isBooleanControl,
  isDateControl,
  isDateTimeControl,
  isEnumControl,
  isIntegerControl,
  isLayout,
  isMultiLineControl,
  isNumberControl,
  isObjectArrayControl,
  isObjectArrayWithNesting,
  isObjectControl,
  isOneOfControl,
  isOneOfEnumControl,
  isPrimitiveArrayControl,
  isStringControl,
  not,
  optionIs,
  or,
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
  hasOption,
} from '@jsonforms/core';

import groupRenderer from './layouts/GroupRenderer.vue';
import numberControlRenderer from './controls/NumberControlRenderer.vue';
import stringControlRenderer from './controls/StringControlRenderer.vue';
import multiStringControlRenderer from './controls/MultiStringControlRenderer.vue';
import dateControlRenderer from './controls/DateControlRenderer.vue';
import dateTimeControlRenderer from './controls/DateTimeControlRenderer.vue';
import objectControlRenderer from './controls/ObjectControlRenderer.vue';
import enumControlRenderer from './controls/EnumControlRenderer.vue';
import arrayPrimitiveControlRenderer from './array/ArrayPrimitiveControlRenderer.vue';
import anyOfRenderer from './controls/AnyOfRenderer.vue';
import allOfRenderer from './controls/AllOfRenderer.vue';
import radioGroupControlRenderer from './controls/RadioGroupControlRenderer.vue';
import verticalLayoutRenderer from './layouts/VerticalLayoutRenderer.vue';
import horizontalLayoutRenderer from './layouts/HorizontalLayoutRenderer.vue';
import integerControlRenderer from './controls/IntegerControlRenderer.vue';
import anyOfStringOrEnumControlRenderer from './controls/AnyOfStringOrEnumControlRenderer.vue';
import enumArrayRenderer from './controls/EnumArrayRenderer.vue';
import oneOfRenderer from './controls/OneOfRenderer.vue';
import oneOfEnumControlRenderer from './controls/OneOfEnumControlRenderer.vue';
import arrayLayoutRenderer from './layouts/ArrayLayoutRenderer.vue';
import arrayControlRenderer from './controls/ArrayControlRenderer.vue';
import booleanControlRenderer from './controls/BooleanControlRenderer.vue';
import mapLayoutRenderer from './layouts/MapLayoutRenderer.vue';
import objectLayoutRenderer from './layouts/ObjectLayoutRenderer.vue';
import objectArrayVocabularyRenderer from './controls/ObjectArrayVocabularyRenderer.vue';
import objectVocabularyControlRenderer from './controls/ObjectVocabularyControlRenderer.vue';

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.type === 'string' && schema.enum !== undefined;

const useArrayLayout = (uiSchema: UISchemaElement) => {
  return uiSchema.options?.useArrayLayout;
};

const useTableLayout = (uiSchema: UISchemaElement) => {
  return uiSchema.options?.useTableLayout;
};

export const findEnumSchema = (schemas: JsonSchema[]) =>
  schemas.find(
    s => s.enum !== undefined && (s.type === 'string' || s.type === undefined)
  );
const findTextSchema = (schemas: JsonSchema[]) =>
  schemas.find(s => s.type === 'string' && s.enum === undefined);

const hasEnumAndText = (schemas: JsonSchema[]): boolean => {
  // idea: map to type,enum and check that all types are string and at least one item is of type enum,
  const enumSchema = findEnumSchema(schemas);
  const stringSchema = findTextSchema(schemas);
  const remainingSchemas = schemas.filter(
    s => s !== enumSchema || s !== stringSchema
  );
  const wrongType = remainingSchemas.find(s => s.type && s.type !== 'string');
  return !!enumSchema && !!stringSchema && !wrongType;
};
const simpleAnyOf = and(
  uiTypeIs('Control'),
  schemaMatches(
    schema => Array.isArray(schema.anyOf) && hasEnumAndText(schema.anyOf)
  )
);

const isObjectArrayVocabularyControl = and(
  isObjectArrayControl,
  hasOption('vocabulary')
);

const isObjectVocabularyControl = and(isObjectControl, hasOption('vocabulary'));

/**
 * @see https://github.com/eclipsesource/jsonforms/issues/1744#issuecomment-2044488336
 */
export const CzRenderers: JsonFormsRendererRegistryEntry[] = [
  {
    renderer: enumControlRenderer,
    tester: rankWith(3, isEnumControl),
  },
  {
    renderer: enumArrayRenderer,
    tester: rankWith(
      5,
      and(
        uiTypeIs('Control'),
        and(
          schemaMatches(
            schema =>
              hasType(schema, 'array') &&
              !Array.isArray(schema.items) &&
              schema.uniqueItems === true
          ),
          schemaSubPathMatches('items', schema => {
            return hasOneOfItems(schema) || hasEnumItems(schema);
          })
        )
      )
    ),
  },
  {
    renderer: arrayPrimitiveControlRenderer,
    tester: rankWith(4, and(not(useArrayLayout), isPrimitiveArrayControl)),
  },
  {
    renderer: groupRenderer,
    tester: rankWith(3, and(isLayout, uiTypeIs('Group'))),
  },
  {
    renderer: numberControlRenderer,
    tester: rankWith(2, isNumberControl),
  },
  {
    renderer: stringControlRenderer,
    tester: rankWith(2, isStringControl),
  },
  {
    renderer: multiStringControlRenderer,
    tester: rankWith(4, and(isStringControl, isMultiLineControl)),
  },
  {
    renderer: dateControlRenderer,
    tester: rankWith(3, isDateControl),
  },
  {
    renderer: dateTimeControlRenderer,
    tester: rankWith(3, isDateTimeControl),
  },
  {
    renderer: objectControlRenderer,
    tester: rankWith(2, isObjectControl),
  },
  {
    renderer: anyOfRenderer,
    tester: rankWith(3, isAnyOfControl),
  },
  {
    renderer: oneOfRenderer,
    tester: rankWith(3, isOneOfControl),
  },
  {
    renderer: oneOfEnumControlRenderer,
    tester: rankWith(5, isOneOfEnumControl),
  },
  {
    renderer: allOfRenderer,
    tester: rankWith(3, isAllOfControl),
  },
  {
    renderer: radioGroupControlRenderer,
    tester: rankWith(20, and(isEnumControl, optionIs('format', 'radio'))),
  },
  {
    renderer: verticalLayoutRenderer,
    tester: rankWith(2, uiTypeIs('VerticalLayout')),
  },
  {
    renderer: horizontalLayoutRenderer,
    tester: rankWith(2, uiTypeIs('HorizontalLayout')),
  },
  {
    renderer: mapLayoutRenderer,
    tester: rankWith(2, uiTypeIs('MapLayout')),
  },
  {
    renderer: arrayLayoutRenderer,
    tester: rankWith(
      4,
      or(isObjectArrayControl, isObjectArrayWithNesting, useArrayLayout)
    ),
  },

  {
    renderer: arrayControlRenderer,
    tester: rankWith(
      5,
      and(useTableLayout, or(isPrimitiveArrayControl, isObjectArrayControl))
    ),
  },
  {
    renderer: integerControlRenderer,
    tester: rankWith(2, isIntegerControl),
  },
  {
    renderer: anyOfStringOrEnumControlRenderer,
    tester: rankWith(2, simpleAnyOf),
  },
  {
    renderer: booleanControlRenderer,
    tester: rankWith(1, isBooleanControl),
  },
  {
    renderer: objectLayoutRenderer,
    tester: rankWith(3, and(isLayout, uiTypeIs('Object'))),
  },
  {
    renderer: objectArrayVocabularyRenderer,
    tester: rankWith(5, isObjectArrayVocabularyControl),
  },
  {
    renderer: objectVocabularyControlRenderer,
    tester: rankWith(5, isObjectVocabularyControl),
  },
];

export const extendedCzRenderers = [...CzRenderers] as any[];
