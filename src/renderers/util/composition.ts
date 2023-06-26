import {
  CombinatorKeyword,
  composePaths,
  computeLabel,
  getFirstPrimitiveProp,
  isDescriptionHidden,
  JsonFormsSubStates,
  Resolve,
  getControlPath,
} from "@jsonforms/core";
import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";
import merge from "lodash/merge";
import get from "lodash/get";
import isPlainObject from "lodash/isPlainObject";
import { useStyles } from "../styles";
import { computed, ComputedRef, inject, ref, provide, watchEffect } from "vue";
import Ajv, { ErrorObject } from "ajv";

export const useControlAppliedOptions = <I extends { control: any }>(
  input: I
) => {
  return computed(() =>
    merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    )
  );
};

export const isCombinatorSchema = (schema: any): string => {
  return schema.anyOf
    ? "anyOf"
    : schema.allOf
    ? "allOf"
    : schema.oneOf
    ? "oneOf"
    : "";
};

export const useComputedLabel = <I extends { control: any }>(
  input: I,
  appliedOptions: ComputedRef<any>
) => {
  return computed((): string => {
    return computeLabel(
      input.control.value.label,
      // TODO: a lot of schemas do not have their `required` property populated for some reason
      input.control.value.required,
      !!appliedOptions.value?.hideRequiredAsterisk
    );
  });
};

/**
 * Adds styles, appliedOptions and vuetifyProps
 */
export const useVuetifyLabel = <I extends { label: any }>(input: I) => {
  const styles = useStyles(input.label.value.uischema);
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.label.value.config),
      cloneDeep(input.label.value.uischema.options)
    )
  );
  const vuetifyProps = (path: string) => {
    const props = get(appliedOptions.value?.vuetify, path);

    return props && isPlainObject(props) ? props : {};
  };
  return {
    ...input,
    appliedOptions,
    vuetifyProps,
    styles,
  };
};

/**
 * Loads default data defined in control schema if the `control.data` is empty.
 */
export const useDefaults = <I extends { control: any; handleChange: any }>(
  input: I
) => {
  if (!input.control.value.data) {
    if (input.control.value.schema.default) {
      input.handleChange(
        input.control.value.path,
        input.control.value.schema.default
      );
    } else {
      input.handleChange(input.control.value.path, undefined);
    }
  }
};

/**
 * Adds styles, isFocused, appliedOptions and onChange
 */
export const useVuetifyControl = <
  I extends { control: any; handleChange: any }
>(
  input: I,
  adaptValue: (target: any) => any = (v) => v,
  debounceWait?: number
) => {
  const changeEmitter =
    typeof debounceWait === "number"
      ? debounce(input.handleChange, debounceWait)
      : input.handleChange;

  const onChange = (value: any) => {
    changeEmitter(input.control.value.path, adaptValue(value));
  };

  const cleanedErrors = computed(() => {
    return (
      input.control.value.errors
        ?.replaceAll(`is a required property`, ``)
        .trim() || ""
    );
  });

  const appliedOptions = useControlAppliedOptions(input);
  const isFocused = ref(false);

  const placeholder = computed(() => {
    return (
      input.control.value.schema.options?.placeholder ||
      appliedOptions.value.placeholder ||
      ""
    );
  });

  const persistentHint = (): boolean => {
    return !isDescriptionHidden(
      input.control.value.visible,
      input.control.value.description,
      isFocused.value,
      !!appliedOptions.value?.showUnfocusedDescription
    );
  };

  const computedLabel = useComputedLabel(input, appliedOptions.value);

  const controlWrapper = computed(() => {
    const { id, description, errors, label, visible, required } =
      input.control.value;
    const isVisible = appliedOptions.value.isViewMode
      ? visible && !!input.control.value.data
      : visible;
    return { id, description, errors, label, visible: isVisible, required };
  });

  const styles = useStyles(input.control.value.uischema);

  const vuetifyProps = (path: string) => {
    const props = {
      ...appliedOptions.value?.vuetify.commonAttrs,
      ...get(appliedOptions.value?.vuetify, path),
    };

    return props && isPlainObject(props) ? props : {};
  };

  return {
    ...input,
    styles,
    isFocused,
    appliedOptions,
    controlWrapper,
    onChange,
    vuetifyProps,
    persistentHint,
    computedLabel,
    isCombinatorSchema,
    cleanedErrors,
    placeholder,
  };
};

export const useTranslator = () => {
  const jsonforms = inject<JsonFormsSubStates>("jsonforms");

  if (!jsonforms) {
    throw new Error(
      "'jsonforms couldn't be injected. Are you within JSON Forms?"
    );
  }

  if (!jsonforms.i18n || !jsonforms.i18n.translate) {
    throw new Error(
      "'jsonforms i18n couldn't be injected. Are you within JSON Forms?"
    );
  }

  const translate = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return jsonforms.i18n!.translate!;
  });

  return translate;
};

/**
 * Adds styles and appliedOptions
 */
export const useVuetifyLayout = <I extends { layout: any }>(input: I) => {
  const appliedOptions = computed(() => {
    return merge(
      {},
      cloneDeep(input.layout.value.config),
      cloneDeep(input.layout.value.uischema.options)
    );
  });

  const computedLabel = computed((): string => {
    return computeLabel(
      input.layout.value.label,
      input.layout.value.required,
      !!appliedOptions.value?.hideRequiredAsterisk
    );
  });

  const layoutWrapper = computed(() => {
    const { id, description, errors, label, visible, required } =
      input.layout.value;
    return { id, description, errors, label, visible, required };
  });

  const vuetifyProps = (path: string) => {
    const props = get(appliedOptions.value?.vuetify, path);

    return props && isPlainObject(props) ? props : {};
  };

  return {
    ...input,
    styles: useStyles(input.layout.value.uischema),
    appliedOptions,
    vuetifyProps,
    layoutWrapper,
    computedLabel,
  };
};

/**
 * Adds styles, appliedOptions and childUiSchema
 */
export const useVuetifyArrayControl = <I extends { control: any }>(
  input: I
) => {
  const appliedOptions = useControlAppliedOptions(input);
  const computedLabel = useComputedLabel(input, appliedOptions);

  const vuetifyProps = (path: string) => {
    const props = get(appliedOptions.value?.vuetify, path);

    return props && isPlainObject(props) ? props : {};
  };

  const description = computed(() => {
    return (
      input.control.value.description ||
      input.control.value.schema?.description ||
      appliedOptions.value.description ||
      ""
    );
  });

  const childLabelForIndex = (index: number | null) => {
    if (index === null) {
      return "";
    }
    const childLabelProp =
      input.control.value.uischema.options?.childLabelProp ??
      getFirstPrimitiveProp(input.control.value.schema);
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(
      input.control.value.data,
      composePaths(`${index}`, childLabelProp)
    );
    if (
      labelValue === undefined ||
      labelValue === null ||
      Number.isNaN(labelValue)
    ) {
      return "";
    }
    return `${labelValue}`;
  };

  const controlWrapper = computed(() => {
    const { id, visible } = input.control.value;

    const isVisible = appliedOptions.value.isViewMode
      ? !!input.control.value.data && input.control.value.data.length > 1
      : visible;
    return { id, visible: isVisible };
  });

  return {
    ...input,
    styles: useStyles(input.control.value.uischema),
    appliedOptions,
    childLabelForIndex,
    computedLabel,
    controlWrapper,
    description,
    vuetifyProps,
    isCombinatorSchema,
  };
};

/** Provides ajv errors to combinator schemas */
export const useCombinatorChildErrors = <I extends { control: any }>(
  input: I,
  keyword: CombinatorKeyword
) => {
  const jsonforms = inject<JsonFormsSubStates>(
    "jsonforms"
  ) as JsonFormsSubStates;

  const selectedIndex = ref(0);

  watchEffect(() => {
    // Get child errors at this path and annotate them
    jsonforms.core?.errors
      ?.filter((e) => {
        const controlPath = getControlPath(e) as string;
        const isChildProp = controlPath.startsWith(
          `${input.control.value.path}.`
        )
          ? !controlPath
              .replace(`${input.control.value.path}.`, "")
              .includes(".")
          : false;
        return controlPath === input.control.value.path || isChildProp;
      })
      .map((e: ErrorObject) => {
        if (e.instancePath && e.parentSchema) {
          const errorSchemaIndex = input.control.value.schema[keyword]?.indexOf(
            e.parentSchema
          );
          if (errorSchemaIndex >= 0) {
            e["_selectedSchemaIndex"] = errorSchemaIndex;
          }
          if (errorSchemaIndex !== selectedIndex.value) {
            // Indicate that the error should be ignored
            e["_keyword"] = keyword; // used to filter out error in CzForm's onChange method
            e["message"] = ""; // removes the error from props of child components
          }
        }
      });
  });

  return {
    selectedIndex,
  };
};

/**
 * Adds styles and appliedOptions
 */
export const useVuetifyBasicControl = <I extends { control: any }>(
  input: I
) => {
  const appliedOptions = useControlAppliedOptions(input);

  const vuetifyProps = (path: string) => {
    const props = get(appliedOptions.value?.vuetify, path);

    return props && isPlainObject(props) ? props : {};
  };

  return {
    ...input,
    styles: useStyles(input.control.value.uischema),
    appliedOptions,
    vuetifyProps,
  };
};

/**
 * Extracts Ajv from JSON Forms
 */
export const useAjv = () => {
  const jsonforms = inject<JsonFormsSubStates>("jsonforms");

  if (!jsonforms) {
    throw new Error(
      "'jsonforms' couldn't be injected. Are you within JSON Forms?"
    );
  }

  // should always exist
  return jsonforms.core?.ajv as Ajv;
};

export interface NestedInfo {
  level: number;
  parentElement?: "array" | "object";
}
export const useNested = (element: false | "array" | "object"): NestedInfo => {
  const nestedInfo = inject<NestedInfo>("jsonforms.nestedInfo", { level: 0 });
  if (element) {
    provide("jsonforms.nestedInfo", {
      level: nestedInfo.level + 1,
      parentElement: element,
    });
  }
  return nestedInfo;
};
