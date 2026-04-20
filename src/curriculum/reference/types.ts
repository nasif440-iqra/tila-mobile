// Types scoped to the reference lesson only.
// NOT exported from the runtime. NOT a shared contract.
// When the real curriculum lands, it will define its own screen types.

export type RefScreen =
  | {
      type: "teach";
      title: string;
      body: string;
      arabicDisplay?: string;
      audioKey?: string;
    }
  | {
      type: "check";
      prompt: string;
      options: string[];
      correctIndex: number;
    };
