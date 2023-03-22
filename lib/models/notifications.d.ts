import { IDialog, IToast } from '@/types';
import { Subject } from 'rxjs';
export default class Notifications {
    static entity: string;
    static toast$: Subject<IToast>;
    static dialog$: Subject<IDialog>;
    static toast(params: IToast): void;
    static openDialog(params: IDialog): void;
}
