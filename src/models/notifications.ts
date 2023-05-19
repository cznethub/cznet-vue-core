import { DEFAULT_TOAST_DURATION } from "@/constants";
import { IDialog, IToast } from "@/types";
import { Subject } from "rxjs";

export default class Notifications {
  static entity = "notification";
  static toast$ = new Subject<IToast>();
  static dialog$ = new Subject<IDialog>();

  static toast(params: IToast) {
    this.toast$.next({
      ...params,
      duration:
        params.duration !== undefined
          ? params.duration
          : DEFAULT_TOAST_DURATION,
      position: params.position || "center",
      isInfinite: !!params.isInfinite,
      type: params.type || "default",
      // isPersistent: params.isPersistent !== undefined ? params.isPersistent : true,
    });
  }

  static openDialog(params: IDialog) {
    this.dialog$.next(params);
  }
}
