import { Vue } from "vue-property-decorator";
import { Subscription } from "rxjs";
import { IDialog, IToast } from "@/types";
export default class CzNotifications extends Vue {
    onToast: Subscription;
    onOpenDialog: Subscription;
    snackbarColors: {
        success: {
            snackbar: string;
            actionButton: string;
        };
        error: {
            snackbar: string;
            actionButton: string;
        };
        info: {
            snackbar: string;
            actionButton: string;
        };
        default: {
            snackbar: undefined;
            actionButton: undefined;
        };
    };
    snackbar: IToast & {
        isActive: boolean;
        isInfinite: boolean;
    };
    dialog: IDialog & {
        isActive: boolean;
    };
    created(): Promise<void>;
    beforeDestroy(): void;
}
