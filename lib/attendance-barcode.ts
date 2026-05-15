/** Payload encoded on stickers; must match `AttendanceController::resolveStudentByBarcodeScan`. */
export type BarcodeStickerEncoding = "admission" | "sid";

export function attendanceBarcodePayload(
  row: { payload_admission: string; payload_sid: string },
  encoding: BarcodeStickerEncoding
): string {
  return encoding === "sid" ? row.payload_sid : row.payload_admission.trim();
}
