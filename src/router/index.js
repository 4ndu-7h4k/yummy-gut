import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "@/config/supabase";
import OrderScreen from "../components/OrderScreen.vue";
import ItemsManagement from "../components/ItemsManagement.vue";
import OrderHistory from "../components/OrderHistory.vue";
import Reports from "../components/Reports.vue";
import Login from "../components/Login.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: "/",
    name: "OrderScreen",
    component: OrderScreen,
    meta: { requiresAuth: true },
  },
  {
    path: "/items",
    name: "ItemsManagement",
    component: ItemsManagement,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders",
    name: "OrderHistory",
    component: OrderHistory,
    meta: { requiresAuth: true },
  },
  {
    path: "/reports",
    name: "Reports",
    component: Reports,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth guard
router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth === false) {
    // If user is already logged in and trying to access login page, redirect to home
    const { data: { session } } = await supabase.auth.getSession()
    if (session && to.path === '/login') {
      next('/')
    } else {
      next()
    }
    return
  }

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session && to.meta.requiresAuth) {
    // Redirect to login if not authenticated
    next('/login')
  } else {
    next()
  }
});

// Debug: Log router creation
console.log(
  "Router created with routes:",
  routes.map((r) => r.path)
);

export default router;
