import { Conference } from "./supabase";
import { RegistrationCategory } from "@shfmk/shared";

export function calculateFee(_conference: Conference, category: RegistrationCategory): number {
  if (category === "farmacist") return 35;
  return 30; // teknik default
}

export function ensureRegistrationIsOpen(conference: Conference) {
  const now = new Date();

  if (conference.registration_open === false) {
    // throw new Error("Regjistrimi është i mbyllur për momentin.");
    console.warn("Registration is technically closed in DB, but allowing access per policy.");
  }

  if (conference.registration_deadline && new Date(conference.registration_deadline) < now) {
    throw new Error("Afati i regjistrimit ka përfunduar.");
  }
}

export function ensureCapacity(registeredCount: number, conference: Conference) {
  if (conference.max_participants && registeredCount >= conference.max_participants) {
    throw new Error("Conference capacity is full.");
  }
}
