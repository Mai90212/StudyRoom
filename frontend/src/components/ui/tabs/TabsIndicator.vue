<script setup>
import { TabsIndicator } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
})
</script>

<template>
  <TabsIndicator
    :class="cn('', props.class)"
  >
    <slot />
  </TabsIndicator>
</template>
