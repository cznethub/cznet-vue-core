<template>
  <!-- Better integration than date-picker, but does not have a `format` property -->
  <!-- TODO: wait for vuetify implementation of a `format` property -->
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-date-input
      v-if="pickerType === 'date'"
      :model-value="pickerValue"
      @update:model-value="onDatePickerValueChange"
      @click:clear="clear"
      color="primary"
      v-bind="vuetifyProps('v-date-input')"
      header="Select date"
      clearable
      :min="minDate"
      :max="maxDate"
      :cancel-text="cancelLabel"
      :ok-text="okLabel"
      :id="control.id + '-input'"
      :class="styles.control.input"
      :label="computedLabel"
      :hint="control.description"
      :required="control.required"
      :error-messages="control.errors"
    />
    <!-- :type="pickerType" -->
  </control-wrapper>
</template>

<script lang="ts">
import { ControlElement, JsonSchema } from '@jsonforms/core';
import { defineComponent } from 'vue';
import { VDateInput } from 'vuetify/components/VDateInput';

import {
  rendererProps,
  RendererProps,
  useJsonFormsControl,
} from '@jsonforms/vue';
import dayjs from 'dayjs';
import {
  parseDateTime,
  useTranslator,
  useVuetifyControl,
} from '@/renderers/util';
import {
  VBtn,
  VDatePicker,
  VIcon,
  VMenu,
  VSpacer,
  VTextField,
} from 'vuetify/components';
import czFieldMessages from '../components/cz.field-messages.vue';

const JSON_SCHEMA_DATE_FORMATS = ['YYYY-MM-DD'];
import { default as ControlWrapper } from './ControlWrapper.vue';

type MinMaxFormat =
  | {
      amount: number;
      unit: 'day' | 'month' | 'year';
    }
  | 'today';

export default defineComponent({
  name: 'date-control-renderer',
  props: {
    ...rendererProps<ControlElement>(),
  },
  components: {
    VTextField,
    VMenu,
    VDatePicker,
    VIcon,
    VSpacer,
    VBtn,
    ControlWrapper,
    czFieldMessages,
    VDateInput,
  },
  setup(props: RendererProps<ControlElement>) {
    const t = useTranslator();

    const adaptValue = (value: any) => value || undefined;
    const control = useVuetifyControl(useJsonFormsControl(props), adaptValue);
    return {
      ...control,
      t,
      adaptValue,
    };
  },
  computed: {
    pickerIcon(): string {
      if (typeof this.appliedOptions.pickerIcon === 'string') {
        return this.appliedOptions.pickerIcon;
      }

      if (this.pickerType === 'year') {
        return 'mdi-alpha-y-box-outline';
      }

      if (this.pickerType === 'month') {
        return 'mdi-calendar-month';
      }

      return 'mdi-calendar';
    },
    dateFormat(): string {
      return typeof this.appliedOptions.dateFormat == 'string'
        ? this.appliedOptions.dateFormat
        : 'YYYY-MM-DD';
    },
    dateSaveFormat(): string {
      return typeof this.appliedOptions.dateSaveFormat == 'string'
        ? this.appliedOptions.dateSaveFormat
        : 'YYYY-MM-DD';
    },
    formats(): string[] {
      return [
        this.dateSaveFormat,
        this.dateFormat,
        ...JSON_SCHEMA_DATE_FORMATS,
      ];
    },
    pickerType(): 'date' | 'month' | 'year' {
      if (!this.dateFormat.includes('M') && !this.dateFormat.includes('D')) {
        return 'year';
      }
      if (!this.dateFormat.includes('D')) {
        return 'month';
      }
      return 'date';
    },
    maxDate(): string | undefined {
      const schema = this.control.schema as JsonSchema & {
        options: Partial<{
          min?: MinMaxFormat;
          max?: MinMaxFormat;
          default?: MinMaxFormat;
        }>;
      };
      if (schema.options?.max) {
        return this.getDateFromOption(schema.options.max);
      }
    },
    minDate(): string | undefined {
      const schema = this.control.schema as JsonSchema & {
        options: Partial<{
          min?: MinMaxFormat;
          max?: MinMaxFormat;
          default?: MinMaxFormat;
        }>;
      };
      if (schema.options?.min) {
        return this.getDateFromOption(schema.options.min);
      }
    },
    inputValue(): string | undefined {
      const date = parseDateTime(this.control.data);
      return date ? date.format(this.dateFormat) : this.control.data;
    },
    pickerValue: {
      get(): Date | undefined {
        const value = this.control.data;
        const date = parseDateTime(value, this.formats);
        // show only valid values
        return date?.toDate() || undefined;
      },
      set(date: Date) {
        this.onPickerChange(date);
      },
    },
    // clearLabel(): string {
    //   const label =
    //     typeof this.appliedOptions.clearLabel == 'string'
    //       ? this.appliedOptions.clearLabel
    //       : 'Clear';

    //   return this.t(label, label);
    // },
    cancelLabel(): string {
      const label =
        typeof this.appliedOptions.cancelLabel == 'string'
          ? this.appliedOptions.cancelLabel
          : 'Cancel';

      return this.t(label, label);
    },
    okLabel(): string {
      const label =
        typeof this.appliedOptions.okLabel == 'string'
          ? this.appliedOptions.okLabel
          : 'OK';
      return this.t(label, label);
    },
  },
  methods: {
    onDatePickerValueChange(value: any) {
      this.pickerValue = value;
    },
    onYearPickerChange(year: any): void {
      const date = dayjs().year(year);
      const dateString = date.format('YYYY');
      const dateTime = parseDateTime(dateString, 'YYYY');
      this.onChange(dateTime?.format(this.dateSaveFormat));
    },
    getDateFromOption(option: MinMaxFormat) {
      if (option) {
        const now = dayjs();

        if (typeof option === 'string' || option instanceof String) {
          if (option === 'today') {
            return now.format('YYYY-MM-DD');
          }
        } else if (option.unit && option.amount) {
          if (option.unit === 'day') {
            const targetDate = now.add(option.amount, 'day');
            return targetDate.format('YYYY-MM-DD');
          } else if (option.unit === 'month') {
            const targetDate = now.add(option.amount, 'month');
            return targetDate.format('YYYY-MM-DD');
          } else if (option.unit === 'year') {
            const targetDate = now.add(option.amount, 'year');
            return targetDate.format('YYYY-MM-DD');
          }
        }
      }
    },
    onInputChange(value: string): void {
      const date = parseDateTime(value, this.dateFormat);
      const newdata = date ? date.format(this.dateSaveFormat) : value;
      if (this.adaptValue(newdata) !== this.control.data) {
        // only invoke onChange when values are different
        this.onChange(newdata);
      }
    },
    onPickerChange(dateValue?: Date): void {
      const date = dayjs(dateValue);

      if (date) {
        const dateString = date.format('YYYY-MM-DD');
        const dateTime = parseDateTime(dateString, 'YYYY-MM-DD');
        this.onChange(dateTime?.format(this.dateSaveFormat));
      }
    },
    clear(): void {
      this.onChange(null);
    },
  },
});
</script>

<style lang="scss" scoped>
:deep(.v-picker) {
  border-radius: 0px;

  .v-picker__title {
    min-height: 102px;
  }

  .v-card__actions {
    border-top: 1px solid #ddd;
  }
}
</style>
