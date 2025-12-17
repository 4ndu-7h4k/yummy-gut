<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-[#F5F5F7] rounded-t-2xl border-gray-200 shadow-lg z-30 safe-area-bottom flex justify-center items-center min-heigh-[70px]">
    <div class="flex items-center justify-center gap-2 py-1 bg-[#dedede] rounded-full px-1 mb-2">
      <router-link
        to="/"
        class="flex flex-col items-center justify-center px-4 py-2 text-xs transition-all duration-300 rounded-xl min-w-[70px]"
        :class="$route.path === '/' ? 'liquid-glass text-blue-600' : 'text-gray-500'"
      >
        <i class="pi pi-shopping-cart text-xl mb-1"></i>
        <span class="font-medium">POS</span>
      </router-link>

      <router-link
        to="/orders"
        class="flex flex-col items-center justify-center px-4 py-2 text-xs transition-all duration-300 rounded-xl min-w-[70px]"
        :class="$route.path === '/orders' ? 'liquid-glass text-blue-600' : 'text-gray-500'"
      >
        <i class="pi pi-list text-xl mb-1"></i>
        <span class="font-medium">Orders</span>
      </router-link>

      <router-link
        to="/items"
        class="flex flex-col items-center justify-center px-4 py-2 text-xs transition-all duration-300 rounded-xl min-w-[70px]"
        :class="$route.path === '/items' ? 'liquid-glass text-blue-600' : 'text-gray-500'"
      >
        <i class="pi pi-box text-xl mb-1"></i>
        <span class="font-medium">Items</span>
      </router-link>

      <router-link
        to="/reports"
        class="flex flex-col items-center justify-center px-4 py-2 text-xs transition-all duration-300 rounded-xl min-w-[70px]"
        :class="$route.path === '/reports' ? 'liquid-glass text-blue-600' : 'text-gray-500'"
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

.liquid-glass {
  background: #cacaca;
  border-radius: 999px;
}

nav > div {
  width: min-content;
}
</style>

