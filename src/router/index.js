import { createRouter, createWebHistory } from "vue-router";
import OrderScreen from "../components/OrderScreen.vue";
import ItemsManagement from "../components/ItemsManagement.vue";
import OrderHistory from "../components/OrderHistory.vue";
import Reports from "../components/Reports.vue";

const routes = [
  {
    path: "/",
    name: "OrderScreen",
    component: OrderScreen,
  },
  {
    path: "/items",
    name: "ItemsManagement",
    component: ItemsManagement,
  },
  {
    path: "/orders",
    name: "OrderHistory",
    component: OrderHistory,
  },
  {
    path: "/reports",
    name: "Reports",
    component: Reports,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Debug: Log router creation
console.log(
  "Router created with routes:",
  routes.map((r) => r.path)
);

export default router;
