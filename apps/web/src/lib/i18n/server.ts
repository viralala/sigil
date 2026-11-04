import "server-only";
import { cookies } from "next/headers";
import { getDict, isLocale, LOCALE_COOKIE, type Locale } from "./index";

export async function currentLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "en";
}

export async function getT() {
  return getDict(await currentLocale());
}
