export interface CreditInfo {
  isCredit: boolean;
  lenderName: string;
  cleanNotes: string;
}

export function parseCreditInfo(notes?: string | null): CreditInfo {
  if (!notes) {
    return { isCredit: false, lenderName: "", cleanNotes: "" };
  }

  const match = notes.match(/^\[UDHAR:(.*?)\]\s*([\s\S]*)$/);
  if (match) {
    const lenderName = match[1].trim();
    const cleanNotes = match[2].trim();
    return {
      isCredit: true,
      lenderName,
      cleanNotes
    };
  }

  return {
    isCredit: false,
    lenderName: "",
    cleanNotes: notes
  };
}
