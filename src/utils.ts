import { Vue } from "vue-property-decorator";

/** Sets the value of an object property reactively
 * https://v2.vuejs.org/v2/guide/reactivity.html#For-Objects
 */
export function setReactive(obj, key: string, value: any) {
  if (obj.hasOwnProperty(key)) {
    // Property is already defined
    obj[key] = true;
  } else {
    // Set reactively
    Vue.set(obj, key, value);
  }
}

/** Stringify a JSON object and avoid circular references */
export function stringify(obj) {
  let cache: any = [];
  const str = JSON.stringify(obj, function (_key, value) {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // reset the cache
  return str;
}
