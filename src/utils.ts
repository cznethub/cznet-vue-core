import { Vue } from "vue-property-decorator";

/** Sets the value of an object property reactively
 * https://v2.vuejs.org/v2/guide/reactivity.html#For-Objects
 */
export function setReactive(obj, key: string, value: any) {
  if (obj.hasOwnProperty(key)) {
    // Property is already defined
    obj.isCutting = true;
  } else {
    // Set reactively
    Vue.set(obj, key, value);
  }
}
