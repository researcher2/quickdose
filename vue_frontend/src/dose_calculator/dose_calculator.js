import { createApp } from 'vue'
import DoseCalculator from './DoseCalculator.vue'
import MathJax, { initMathJax, renderByMathjax } from "mathjax-vue3";

function onMathJaxReady() {
  const el = document.getElementById("elementId");
  renderByMathjax(el);
}

initMathJax({}, onMathJaxReady);

const app = createApp(DoseCalculator)
app.use(MathJax).mount('#app')
