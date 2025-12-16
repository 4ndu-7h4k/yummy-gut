<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 safe-area-bottom">
    <div class="flex items-center justify-around py-2">
      <router-link
        to="/"
        class="flex flex-col items-center justify-center px-4 py-2 text-xs transition-colors"
        :class="$route.path === '/' ? 'text-blue-600' : 'text-gray-500'"
      >
        <i class="pi pi-shopping-cart text-xl mb-1"></i>
        <span class="font-medium">POS</span>
      </router-link>

      <router-link
        to="/orders"
        class="flex flex-col items-center justify-center px-4 py-2 text-xs transition-colors"
        :class="$route.path === '/orders' ? 'text-blue-600' : 'text-gray-500'"
      >
        <i class="pi pi-list text-xl mb-1"></i>
        <span class="font-medium">Orders</span>
      </router-link>

      <router-link
        to="/items"
        class="flex flex-col items-center justify-center px-4 py-2 text-xs transition-colors"
        :class="$route.path === '/items' ? 'text-blue-600' : 'text-gray-500'"
      >
        <i class="pi pi-box text-xl mb-1"></i>
        <span class="font-medium">Items</span>
      </router-link>

      <router-link
        to="/reports"
        class="flex flex-col items-center justify-center px-4 py-2 text-xs transition-colors"
        :class="$route.path === '/reports' ? 'text-blue-600' : 'text-gray-500'"
      >
        <i class="pi pi-chart-bar text-xl mb-1"></i>
        <span class="font-medium">Reports</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>

