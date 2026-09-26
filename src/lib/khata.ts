export interface CreditInfo {
  isCredit: boolean;
  lenderName: string;
  paidAmount: number;
  pendingBalance: number;
  cleanNotes: string;
}

export function parseCreditInfo(notes?: string | null, totalAmount: number = 0): CreditInfo {
  if (!notes) {
    return {
      isCredit: false,
      lenderName: "",
      paidAmount: totalAmount,
      pendingBalance: 0,
      cleanNotes: ""
    };
  }

  // Matches [UDHAR: tag_content] notes
  const matchTag = notes.match(/^\[UDHAR:([^\]]+)\]\s*([\s\S]*)$/);
  if (matchTag) {
    const tagContent = matchTag[1].trim();
    const cleanNotes = matchTag[2].trim();

    let lenderName = "";
    let paidAmount = 0;

    // Handle multiple or single |PAID: parts cleanly
    const paidParts = tagContent.split("|PAID:");
    if (paidParts.length > 1) {
      lenderName = paidParts[0].trim();
      // Take the last PAID: value if duplicated
      const lastPaidStr = paidParts[paidParts.length - 1].trim();
      paidAmount = Number(lastPaidStr) || 0;
    } else {
      lenderName = tagContent.trim();
      paidAmount = 0;
    }

    const pendingBalance = Math.max(0, totalAmount - paidAmount);

    return {
      isCredit: true,
      lenderName,
      paidAmount,
      pendingBalance,
      cleanNotes
    };
  }

  return {
    isCredit: false,
    lenderName: "",
    paidAmount: totalAmount,
    pendingBalance: 0,
    cleanNotes: notes
  };
}

export function buildCreditTag(lenderName: string, paidAmount: number = 0): string {
  const cleanLender = lenderName.trim();
  return `[UDHAR: ${cleanLender}|PAID:${paidAmount}]`;
}
