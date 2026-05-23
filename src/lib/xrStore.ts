import { createXRStore } from '@react-three/xr'

export const xrStore = createXRStore({
  controller: { teleportPointer: false },
  hand: { teleportPointer: false },
})
