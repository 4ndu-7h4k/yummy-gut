import { ref, onMounted, onUnmounted } from 'vue'

export function useFullscreen() {
  const isFullscreen = ref(false)

  const checkFullscreen = () => {
    isFullscreen.value = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
  }

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement

      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        // Safari
        await element.webkitRequestFullscreen()
      } else if (element.mozRequestFullScreen) {
        // Firefox
        await element.mozRequestFullScreen()
      } else if (element.msRequestFullscreen) {
        // IE/Edge
        await element.msRequestFullscreen()
      }
      
      isFullscreen.value = true
    } catch (error) {
      console.error('Error entering fullscreen:', error)
      throw error
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        // Safari
        await document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        // Firefox
        await document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        // IE/Edge
        await document.msExitFullscreen()
      }
      
      isFullscreen.value = false
    } catch (error) {
      console.error('Error exiting fullscreen:', error)
      throw error
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen.value) {
        await exitFullscreen()
      } else {
        await enterFullscreen()
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
      throw error
    }
  }

  // Check if fullscreen is supported
  const isSupported = () => {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    )
  }

  // Listen for fullscreen changes
  onMounted(() => {
    checkFullscreen()
    
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ]
    
    events.forEach(event => {
      document.addEventListener(event, checkFullscreen)
    })
  })

  onUnmounted(() => {
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ]
    
    events.forEach(event => {
      document.removeEventListener(event, checkFullscreen)
    })
  })

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    isSupported
  }
}

