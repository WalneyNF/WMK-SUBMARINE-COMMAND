# Pesquisa técnica — WMK Ocean Engine

## Fontes
- Three.js ShaderMaterial: https://threejs.org/docs/pages/ShaderMaterial.html
- Exemplo de oceano: https://threejs.org/examples/#webgl_shaders_ocean
- Ondas e normais analíticas: https://threejsdemos.com/demos/shaders/water

## Implementação v0.4.1
Shader GLSL original com três ondas senoidais direcionais, derivadas analíticas para normais, ondulações de detalhe, Fresnel, reflexo aproximado do céu, brilho especular, espuma de crista e neblina. O módulo js/ocean.js disponibiliza heightAt para sincronizar a altura visual dos navios. Não é uma implementação completa de Gerstner, FFT, refração física ou reflexos da geometria da cena.

## Estados do mar
Calmo (0.35), ondulado (1), agitado (1.8). Multiplicadores arcade da amplitude. Malha estática de 160 x 160 segmentos, deformada na GPU; sem recomputar normais pela CPU. O custo de fragmentos e a transparência ainda precisam de medição na GT 710.

## Próximos passos
- Perfis gráficos com diferentes resoluções de malha.
- Reflexo planar opcional.
- Espuma de esteira, partículas, bolhas, cáusticas e iluminação subaquática.
- Céu procedural, clima, chuva e ciclo dia/noite.
- Flutuação com inclinação e colisão com a superfície.
- Laboratório de água com sliders.
- Testes WebGL, compilação GLSL e FPS em hardware real.

Autor: Walney Moreira Klein — walneyk@hotmail.com.

## Pesquisa v0.4.2
- World of Warships: https://worldofwarships.com/en/news/general-news/graphics-update-review/ — ondas, espuma e esteiras dinâmicas.
- War Thunder: https://warthunder.com/en/news/9957-development-ninth-wave-new-water-and-naval-battle-effects-en — integração visual de água e espuma.
- NVIDIA GPU Gems: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models — ondas geométricas e detalhes de superfície.

Implementação original aproximada, sem FFT, reflexão planar ou dinâmica real de fluidos. A esteira utiliza uma faixa histórica de até 48 amostras por embarcação, com dissolução gradual. A malha usa 192 segmentos por lado; desempenho ainda não medido.
