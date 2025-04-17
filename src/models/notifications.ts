import { DEFAULT_TOAST_DURATION, INITIAL_SNACKBAR } from '../constants';
import { IDialog, IToast } from '../types';
import { Subject } from 'rxjs';

export default class Notifications {
  static entity = 'notification';
  static toast$ = new Subject<IToast>();
  static dialog$ = new Subject<IDialog>();

  static toast(params: IToast) {
    this.toast$.next({
      ...INITIAL_SNACKBAR,
      ...params,
    });
  }

  static openDialog(params: IDialog) {
    this.dialog$.next(params);
  }
}
