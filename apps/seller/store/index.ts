"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@pharmabag/utils";

interface SellerAuth { user: User | null; isAuth: boolean; setUser: (u: User | null) => void; logout: () => void; }
export const useSellerAuth = create<SellerAuth>()(persist((set) => ({
  user: null, isAuth: false,
  setUser: (user) => set({ user, isAuth: !!user }),
  logout: () => set({ user: null, isAuth: false }),
}), { name: "pb-seller-auth" }));
