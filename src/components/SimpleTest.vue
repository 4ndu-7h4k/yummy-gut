<template>
  <div class="p-8 bg-white min-h-screen">
    <h1 class="text-3xl font-bold text-ios-blue mb-4">✅ Router is Working!</h1>
    <p class="text-gray-700 mb-4">If you can see this page, the router is loading correctly.</p>
    <router-link 
      to="/" 
      class="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
    >
      Go to POS Screen
    </router-link>
  </div>
</template>

<script setup>
console.log('SimpleTest component loaded!')
</script>

