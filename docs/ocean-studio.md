# WMK Ocean Studio — Manual técnico v0.4.3

## 1. Arquitetura
O jogo e o editor utilizam o mesmo módulo js/ocean.js. O arquivo js/ocean-config.js define o schema JSON, valores padrão, presets, validação e persistência. O editor studio/ocean.html é independente do combate. O conceito é semelhante a um Material Instance e um Water Waves Asset da Unreal Engine, mas não utiliza o motor Unreal.

## 2. Construção do oceano
1. Crie uma PlaneGeometry de 700 × 700 unidades no plano XZ, com 192 segmentos por lado no preset original.
2. Crie um ShaderMaterial de dupla face. O vertex shader desloca a altura Y; o fragment shader calcula a aparência.
3. Para cada camada, calcule fase = kx*x + kz*z + velocidadeAngular*tempo. A altura é a soma amplitudeGlobal × amplitudeDaCamada × seno(fase).
4. Derive a altura em X e Z analiticamente: amplitude × cos(fase) × vetor de onda. A normal é normalize(-derivadaX, 1, -derivadaZ).
5. Combine normais com ondulações finas, Fresnel, reflexão aproximada do céu, brilho solar e espuma baseada na altura e ruído.
6. Aplique neblina e opacidade diferentes quando a câmera está submersa.
7. Use heightAt(x,z) na CPU para sincronizar a altura das embarcações e a inclinação dos navios. CPU e GPU usam os mesmos parâmetros e relógio.

## 3. Esteiras e bolhas
A cada intervalo de 0,12 s, registre a posição da popa em coordenadas do mundo. Cada amostra forma duas extremidades de uma faixa triangular. A largura cresce com a idade; a opacidade decai até zero. O vertex shader posiciona a faixa na superfície ondulada. Ao submergir, o veículo passa a emitir bolhas instanciadas, limitadas a 160. Não há simulação hidrodinâmica ou de turbulência física.

## 4. Parâmetros
| Campo | Significado |
|---|---|
| amplitude | Multiplicador global de altura |
| rate | Velocidade de avanço da fase |
| waves[].amplitude | Altura individual em unidades do mundo |
| waves[].kx, kz | Vetor de onda em radianos/unidade; direção de propagação oposta ao vetor na convenção de fase positiva |
| waves[].speed | Velocidade angular em radianos/segundo |
| detail | Intensidade das pequenas ondulações |
| deep, shallow | Cores hexadecimais sRGB |
| foam, foamColor | Intensidade e cor da espuma |
| reflection, sun | Intensidades da reflexão aproximada e brilho solar |
| opacity, underOpacity | Opacidade acima e abaixo da superfície |
| wake, wakeLife, wakeSpread | Intensidade, duração e expansão visual da esteira |
| bubbles | Taxa aproximada de emissão |
| segments | Subdivisões da malha por eixo |

Comprimento de onda = 2π / sqrt(kx²+kz²), quando o vetor não é nulo. A escala do jogo é arcade; não confunda unidades do mundo com metros físicos.

## 5. JSON
Use o editor para exportar um arquivo completo. Um exemplo parcial é:
```json
{"schema":1,"amplitude":1.4,"rate":0.9,"deep":"#103b59","shallow":"#287d86","foam":1.2,"wakeLife":10,"waves":[{"amplitude":0.5,"kx":0.12,"kz":0.04,"speed":0.9}]}
```
Campos ausentes usam os padrões, números são limitados a intervalos seguros e o schema deve ser 1. O JSON é dados, não código executável. O jogo e o Studio compartilham a chave localStorage wmk_ocean_v1 na mesma origem (protocolo, host e porta). O botão Salvar para o jogo dispara a atualização nas outras abas; exportar JSON cria um arquivo portátil, mas não altera arquivos do repositório. Para compartilhar uma configuração com outro computador, importe o arquivo no Studio e salve.

## 6. Tutorial prático
- Abra index.html via Live Server e clique em Ocean Studio.
- Escolha um preset e selecione Navio na superfície.
- Aumente a amplitude e observe a geometria. Reduza a velocidade das ondas para observar as cristas.
- Abra cada uma das quatro camadas e altere separadamente amplitude e vetor.
- Edite as cores e a espuma; compare a reflexão em diferentes ângulos.
- Ajuste duração e expansão da esteira enquanto o navio navega.
- Selecione Submarino submerso e gire a câmera para baixo da água.
- Exporte JSON, restaure o padrão, importe o arquivo e confira os valores.
- Salve para o jogo e confirme a atualização na outra aba.
- Feche, arraste ou redimensione painéis; o layout é salvo localmente.

## 7. Desempenho e limitações
64 segmentos geram 8192 triângulos; 192 geram 73728; 256 geram 131072. A GPU calcula as ondas; o custo do fragment shader depende da resolução. Para GT 710 experimente 96 ou 128 segmentos. A reflexão não inclui a geometria real da cena. Não há FFT, refração física, sistema de materiais por nós ou simulação de fluidos completa. Testes WebGL reais continuam necessários.

Autor: Walney Moreira Klein — walneyk@hotmail.com. MIT para contribuições próprias.
