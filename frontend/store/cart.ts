import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Dish } from "@/lib/types";

interface CartState {
  items: CartItem[];
  guestCount: number;
  serviceTypeId: number | null;
  packageId: number | null;
  eventType: string;
  setGuestCount: (n: number) => void;
  setServiceType: (id: number) => void;
  setPackage: (id: number | null) => void;
  setEventType: (t: string) => void;
  addItem: (dish: Dish) => void;
  removeItem: (dishId: number) => void;
  updateQuantity: (dishId: number, qty: number) => void;
  clearCart: () => void;
  totalDishCost: () => number;
  grandTotal: (packagePricePerHead?: number) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      guestCount: 10,
      serviceTypeId: null,
      packageId: null,
      eventType: "Birthday",

      setGuestCount: (n) => set({ guestCount: n }),
      setServiceType: (id) => set({ serviceTypeId: id }),
      setPackage: (id) => set({ packageId: id }),
      setEventType: (t) => set({ eventType: t }),

      addItem: (dish) => {
        const items = get().items;
        const existing = items.find((i) => i.dish.id === dish.id);
        if (existing) {
          set({ items: items.map((i) => i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { dish, quantity: 1 }] });
        }
      },

      removeItem: (dishId) => set({ items: get().items.filter((i) => i.dish.id !== dishId) }),

      updateQuantity: (dishId, qty) => {
        if (qty <= 0) return get().removeItem(dishId);
        set({ items: get().items.map((i) => i.dish.id === dishId ? { ...i, quantity: qty } : i) });
      },

      clearCart: () => set({ items: [], serviceTypeId: null, packageId: null }),

      totalDishCost: () => {
        const { items, guestCount } = get();
        return items.reduce((sum, i) => sum + i.dish.price_per_head * i.quantity * guestCount, 0);
      },

      grandTotal: (packagePricePerHead = 0) => {
        const { guestCount } = get();
        const dishes = get().totalDishCost();
        const pkg = packagePricePerHead * guestCount;
        const subtotal = dishes + pkg;
        const discount = guestCount >= 50 ? subtotal * 0.05 : 0;
        return subtotal - discount;
      },
    }),
    { name: "cart-storage" }
  )
);
