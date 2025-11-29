import { Conference } from "./supabase";
import { RegistrationCategory } from "@shfmk/shared";

export function calculateFee(conference: Conference, category: RegistrationCategory): number {
  switch (category) {
    case "member":
      return Number(conference.member_fee);
    case "non_member":
      return Number(conference.non_member_fee);
    case "student":
      return Number(conference.student_fee);
    default:
      return Number(conference.non_member_fee);
  }
}

export function ensureRegistrationIsOpen(conference: Conference) {
  const now = new Date();

  if (conference.registration_open && new Date(conference.registration_open) > now) {
    throw new Error("Registrations are not open yet for this conference.");
  }

  if (conference.registration_close && new Date(conference.registration_close) < now) {
    throw new Error("Registration window has closed.");
  }
}

export function ensureCapacity(registeredCount: number, conference: Conference) {
  if (conference.max_participants && registeredCount >= conference.max_participants) {
    throw new Error("Conference capacity is full.");
  }
}
