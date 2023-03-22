export interface IToast {
    message: string;
    duration?: number;
    position?: 'center' | 'left';
    isInfinite?: boolean;
    type?: 'success' | 'error' | 'info' | 'default';
}
export interface IDialog {
    title: string;
    content: string;
    confirmText?: string;
    secondaryActionText?: string;
    cancelText?: string;
    onConfirm: () => any;
    onSecondaryAction?: () => any;
    onCancel?: () => any;
}
