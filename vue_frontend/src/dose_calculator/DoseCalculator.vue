<script setup lang="ts">

  import { onMounted, reactive, watch, computed } from 'vue'
  import slider from "vue3-slider"
  import {calculate_dose, type Dataset} from "./calculations"
  import TextAndSlider from "./TextAndSlider.vue"

  interface State
  {
    loaded: boolean

    brand: "Elekta" | "Varian"
    energy: "6" | "10"

    monitor_units: number
    field_size_x: number
    field_size_y: number
    depth: number
    ssd: number

    pdd: number
    f: number
    ssdf: number
    af: number
    dataset: Dataset | null
    af_pair: Array<number> | null
    pdd_depth_pair: Array<number> | null
    pdd_area_pair: Array<number>  | null

    dose: number

  }

  const state: State = reactive(
  {
    loaded: false,

    brand: "Varian",
    energy: "6",

    monitor_units: 0,
    field_size_x: 0,
    field_size_y: 0,
    depth: 0,
    ssd: 0,

    pdd: 0,
    f: 0,
    ssdf: 0,
    af: 0,
    dataset: null,
    af_pair: null,
    pdd_depth_pair: null,
    pdd_area_pair: null,

    dose: 0,
  });

  // Computed Values
  // ==========================================================================
  const af_formula_1 = computed(() =>
  {
    if (state.dataset == null)
      return ""

    const lhs = `\\left({}\\frac{${state.ssd} + ${state.dataset.dmax}}{100 + ${state.dataset.dmax}}\\right)^{2}`;
    const rhs = `\\left({}\\frac{100 + ${state.depth}}{${state.ssd} + ${state.depth}}\\right)^{2}`;
    return `${lhs} * ${rhs}`;
  });

  const ssdf_formula_1 = computed(() =>
  {
    if (state.dataset == null)
      return ""

    return `\\left({}\\frac{100 + ${state.dataset.dmax}}{${state.ssd} + ${state.dataset.dmax}}\\right)^{2}`
  });

  const surface_field_size = computed(() =>
  {
    const field_size = state.field_size_x * state.field_size_y;
    return field_size * Math.pow((state.ssd / 100),2);
  });

  const scaled_dose = computed(() =>
  {
    if (state.dose >= 100)
      return state.dose / 100
    else
      return state.dose
  })

  const dose_unit = computed(() =>
  {
    if (state.dose >= 100)
      return "Gy"
    else
      return "cGy"
  })


  // Reactive Watchers
  // ==========================================================================
  watch(() => [state.monitor_units, state.field_size_x, state.field_size_y, state.depth, state.ssd], async (new_data, old_data) =>
  {
    state.dose = 0;
    state.dataset = null;
    state.af_pair = null;
    state.pdd_depth_pair = null;
    state.pdd_area_pair = null;
  })

  watch(() => [state.brand, state.energy], async (new_data, old_data) => 
  {
    set_defaults()
  });


  // Validations
  // ==========================================================================
  interface Configuration
  {
    default: number
    min: number
    max: number
    step: number
  }

  function validate_min_max(value: number, configuration: Configuration)
  {
    return value <= configuration.max && value >= configuration.min
  }

  const valid_monitor_units = computed(() => validate_min_max(state.monitor_units, input_settings.monitor_units));
  const valid_field_size_x = computed(() => validate_min_max(state.field_size_x, input_settings.field_size_x));
  const valid_field_size_y = computed(() => validate_min_max(state.field_size_y, input_settings.field_size_y));
  const valid_depth = computed(() => validate_min_max(state.depth, input_settings.depth[state.brand][state.energy]));
  const valid_ssd = computed(() => validate_min_max(state.ssd, input_settings.ssd));

  const all_valid = computed(() =>
  {
    return valid_monitor_units.value && valid_field_size_x.value && valid_field_size_y.value &&
           valid_depth.value && valid_ssd.value;
  });

  // Configuration
  // ==========================================================================
  const slider_color = "#FB278D";
  const track_color = "#FEFEFE";
  const slider_handle_scale = 3;
  const slider_height = 5;

  const depth_defaults = {
    Elekta: { 
      "6": 1.5,
      "10": 2.2
    },
    Varian: { 
      "6": 1.4,
      "10": 2.2
    },     
  }

  let input_settings = {
    monitor_units: {default: 100, min: 0, max: 1000, step: 0.5},
    field_size_x: {default: 10, min: 3, max: 40, step: 0.5},
    field_size_y: {default: 10, min: 3, max: 40, step: 0.5},    
    ssd: {default: 100, min: 70, max: 130, step: 0.5},
    depth: { 
      Elekta:
      {
        "6": {default: 1.5, min: 0, max: 30, step: 0.1},
        "10": {default: 2.2, min: 0, max: 30, step: 0.1},
      },
      Varian:
      {
        "6": {default: 1.4, min: 1.4, max: 30, step: 0.5},
        "10": {default: 2.2, min: 2.2, max: 30, step: 0.5},
      },
    }
  }

  const calibration_constant = 0.01


  // Functions
  // ==========================================================================
  async function do_calculations()
  {
    const results = (calculate_dose(state.brand, state.energy, state.monitor_units, state.field_size_x, 
                                    state.field_size_y, state.depth, state.ssd))

    state.pdd = results.pdd;
    state.f = results.f;
    state.ssdf = results.ssdf;
    state.af = results.af;
    state.af_pair = results.af_pair;
    state.pdd_area_pair = results.pdd_area_pair;
    state.pdd_depth_pair = results.pdd_depth_pair;
    state.dataset = results.dataset;
    state.dose = results.dose;    
  }

  async function set_defaults()
  {
    state.monitor_units = input_settings.monitor_units.default;
    state.field_size_x = input_settings.field_size_x.default;
    state.field_size_y = input_settings.field_size_y.default;
    state.depth = input_settings.depth[state.brand][state.energy].default;
    state.ssd = input_settings.ssd.default;
  }

  async function startup()
  {
    set_defaults();
  }

  onMounted(() => 
  {
    startup()
    state.loaded = true;
  })

</script>

<template>
  <div id="main">
    <h1>QuickDose</h1>

    <div class="option_group">
      <label>Brand:</label>
      
      <input type="radio" name="brand" value="Elekta" v-model="state.brand">
      <p>Elekta</p>

      <input type="radio" name="brand" value="Varian" v-model="state.brand">    
      <p>Varian</p>
    </div>

    <div class="option_group">
      <label>Energy:</label>
      
      <input type="radio" name="energy" value="6" v-model="state.energy">
      <p>6 MV</p>

      <input type="radio" name="energy" value="10" v-model="state.energy">    
      <p>10 MV</p>
    </div>

    <hr>

    <template v-if="state.loaded">
      <TextAndSlider label="Monitor Units"
                  v-model="state.monitor_units" :slider_color="slider_color" :track_color="track_color"
                  :slider_handle_scale="slider_handle_scale" :slider_height="slider_height"
                  :min="input_settings.monitor_units.min" :max="input_settings.monitor_units.max"
                  :step="input_settings.monitor_units.step">
      </TextAndSlider>

      <TextAndSlider label="Field Size - X (cm)"
                  v-model="state.field_size_x" :slider_color="slider_color" :track_color="track_color"
                  :slider_handle_scale="slider_handle_scale" :slider_height="slider_height"
                  :min="input_settings.field_size_x.min" :max="input_settings.field_size_x.max"
                  :step="input_settings.field_size_x.step">
      </TextAndSlider>

      <TextAndSlider label="Field Size - Y (cm)"
                  v-model="state.field_size_y" :slider_color="slider_color" :track_color="track_color"
                  :slider_handle_scale="slider_handle_scale" :slider_height="slider_height"
                  :min="input_settings.field_size_y.min" :max="input_settings.field_size_y.max"
                  :step="input_settings.field_size_y.step">
      </TextAndSlider>

      <TextAndSlider label="Depth (cm)"
                  v-model="state.depth" :slider_color="slider_color" :track_color="track_color"
                  :slider_handle_scale="slider_handle_scale" :slider_height="slider_height"
                  :min="input_settings.depth[state.brand][state.energy].min" 
                  :max="input_settings.depth[state.brand][state.energy].max"
                  :step="input_settings.depth[state.brand][state.energy].step">
      </TextAndSlider>

      <TextAndSlider label="SSD (cm)"
                  v-model="state.ssd" :slider_color="slider_color" :track_color="track_color"
                  :slider_handle_scale="slider_handle_scale" :slider_height="slider_height"
                  :min="input_settings.ssd.min" :max="input_settings.ssd.max"
                  :step="input_settings.ssd.step">
      </TextAndSlider>
    </template>

    <button @click="do_calculations()" :disabled="!all_valid">CALCULATE</button>

    <div id="dose">Dose = {{ scaled_dose.toFixed(2) }}{{ dose_unit }}</div>

    <div class="explanation_section">  
      <math-jax latex="TD = {}\frac{MU * K * PDD * F * SSDF}{AF * 100}"></math-jax>
    </div>

    <div class="explanation_section">
      <p>MU (Monitor Units) = {{ state.monitor_units }}</p>
    </div>

    <div class="explanation_section">    
      <p>K (Calibration Constant) = {{ calibration_constant }}</p>
    </div>

    <div class="explanation_section">
      <p>PDD (Percentage Depth Dose) = {{ state.pdd }}</p>
      <p>Perform table lookup / interpolation with relevant depth and surface field size</p>

      <math-jax latex="surface\_field\_size = field\_size\_x * field\_size\_y * \left(\frac{ssd}{100}\right)^{2}"></math-jax>
      <p>Surface Field Size = {{ surface_field_size }}</p>

      <table v-if="state.dataset != null">
        <th>
          <td>Area</td>
          <td>Depth</td>
        </th>
        <tr v-if="state.pdd_area_pair != null && state.pdd_depth_pair != null"
            v-for="(row, row_index) in state.dataset.pdds" 
            :class="{highlight: state.pdd_area_pair.includes(row_index)}">
            <td v-for="(entry, col_index) in row"
                :class="{highlight: state.pdd_depth_pair.includes(col_index)}">{{entry}}</td>
        </tr>
      </table>
    </div>

    <div class="explanation_section">
      <p>F (Maynard Factor) = {{ state.f }}</p>
      <math-jax latex="\left({}\frac{ssd + dmax}{100 + dmax}\right)^{2} * \left({}\frac{100 + depth}{ssd + depth}\right)^{2}"></math-jax>
      <math-jax :latex="af_formula_1"></math-jax>
    </div>


    <div class="explanation_section">
      <p>SSDF (SSD Factor) = {{ state.ssdf }}</p>
      <math-jax latex="\left({}\frac{100 + dmax}{ssd + dmax}\right)^{2}"></math-jax>
      <math-jax :latex="ssdf_formula_1"></math-jax>
    </div>

    
    <div class="explanation_section">
      <p>AF (Area Factor Inverse) = {{ state.af }}</p>
      <p>Field Area = {{ state.field_size_x * state.field_size_y }}</p>    
      <br>

      <table v-if="state.dataset != null">
        <th>
          <td>Area</td>
          <td>Output Factor</td>
        </th>
        <tr v-if="state.af_pair != null"
            v-for="(row, index) in state.dataset.output_factors" 
            :class="{highlight: state.af_pair.includes(index)}">
            <td>{{row[0]}}</td>
            <td>{{row[1]}}</td>        
        </tr>
      </table>
    </div>
    
  </div>
</template>

<style lang="scss">

  html, body
  {
    font-family: -apple-system, blinkmacsystemfont, Segoe UI, roboto, oxygen, ubuntu, cantarell, Open Sans, Helvetica Neue, sans-serif
  }

  body
  {
    overflow: scroll;    
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 20px;
  }

  #main {
    max-width: 1024px;
    margin: 0 auto;
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .option_group  
  {
    display: flex;
    column-gap: 10px;
    align-items: center;
    margin-bottom: 10px;

    label
    {
      font-size: 20px;
    }
  }

  .number_input
  {
    margin-bottom: 10px;
    label 
    {
      display: block;
      font-size: 20px;
      margin-bottom: 10px;
    }

    .value_and_slider 
    {
      display: flex;
      align-items: center;
      column-gap: 10px;
    }
  }

  #dose 
  {
    font-size: 30px;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    padding-top: 10px;
    padding-bottom: 10px;
    margin-top: 10px;
  }

  table {
    border: 1px solid black;

    text-align: left;

    td {
      padding: 5px;
    }

    .highlight { background-color: yellow }

  }

  .explanation_section {
    border-bottom: 1px solid black;
    padding-top: 10px;
    padding-bottom: 10px;

    mjx-container
    {
      display: block;
      margin-bottom: 10px;
    }

    p { margin-bottom: 10px; }
  }



</style>
