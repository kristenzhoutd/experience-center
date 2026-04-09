declare global {
  interface MktoForm {
    vals(values?: Record<string, unknown>): Record<string, unknown>;
    submit(): void;
    onSuccess(callback: (values: Record<string, unknown>, followUpUrl?: string) => boolean): void;
    addHiddenFields(fields: Record<string, string>): void;
    submittable(canSubmit: boolean): void;
  }

  interface MktoForms2Static {
    loadForm(baseUrl: string, munchkinId: string, formId: number, callback?: (form: MktoForm) => void): void;
    setOptions(options: Record<string, string>): void;
  }

  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aiSuites: any;
    dataLayer: Record<string, unknown>[];
    gtag: (...args: [string, ...unknown[]]) => void;
    MktoForms2?: MktoForms2Static;
  }
}

export {};
