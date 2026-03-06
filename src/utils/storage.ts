import { Contract } from "../types";
import { STORAGE_KEY } from "../constants";
import { DEMO_CONTRACTS } from "./demoData";

export async function loadContracts(): Promise<Contract[]> {
  try {
    // @ts-ignore
    const r = await window.storage.get(STORAGE_KEY);
    if (r?.value) {
      const p = JSON.parse(r.value);
      if (Array.isArray(p) && p.length > 0) return p;
    }
  } catch (e) {}
  return DEMO_CONTRACTS;
}

export async function persistContracts(cs: Contract[]): Promise<void> {
  try {
    // @ts-ignore
    await window.storage.set(STORAGE_KEY, JSON.stringify(cs));
  } catch (e) {}
}
