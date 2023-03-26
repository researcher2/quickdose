<script setup lang="ts">

  import { onMounted, reactive, watch, computed, ref } from 'vue'
  import slider from "vue3-slider"

  const props = defineProps<{
    label: string
    modelValue: number
    slider_color: string
    track_color: string
    slider_handle_scale: number
    slider_height: number
    min: number
    max: number
    step: number
  }>()

  const emit = defineEmits(['update:modelValue']);  

  const input_value = computed({
    get() {
      return props.modelValue
    },
    set(value) {
      if (typeof value == "number")
      {
        emit('update:modelValue', value)
      }
    }
  })

  const value_error = computed(() =>
  {
    if (input_value.value > props.max)
      return `(Exceeds max of ${props.max})`
    else if (input_value.value < props.min)
      return  `(Below min of ${props.min})`
    else
      return ""
  });


  interface State
  {
    slider_value: number  
    slider_focus: boolean
    error: string
    loaded: boolean
  }

  const state: State = reactive(
  {
    slider_value: 0,
    slider_focus: false,
    error: "",
    loaded: false
  });

  watch(() => props.modelValue, async (new_data, old_data) =>
  {
    state.slider_value = new_data
  })

  function on_slider_change(new_value: number)
  {
    if (!state.slider_focus)
      return

    input_value.value = new_value;
  }

  onMounted(() => 
  {
    state.slider_value = props.modelValue
    state.loaded = true
  })
</script>

<template>
  <div class="number_input" v-if="state.loaded">
    <label>{{props.label}} <span class="error">{{value_error}}</span></label>
    <div class="value_and_slider">
      <input type="number" v-model="input_value">
      <slider v-model="state.slider_value" :color="props.slider_color" :track-color="props.track_color"
              :alwaysShowHandle="true" :handleScale="props.slider_handle_scale" :height="props.slider_height"
              :min="props.min" :max="props.max" :step="props.step" @change="on_slider_change" 
              @drag-start="state.slider_focus = true" @drag-end="state.slider_focus = false"/>
    </div>
  </div>
</template>

<style lang="scss">
  .error { color: red; }
</style>
