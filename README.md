<p align="center"><img src="assets/logo.svg" width="680" alt="WMK Submarine Command"></p>

# WMK Submarine Command — Abissal

**Versão 0.4.0 | Simulador naval 3D arcade para navegador**

Comande submarinos fictícios, explore o oceano, realize missões e evolua sua frota. Desenvolvido em HTML5, CSS3, JavaScript e Three.js 0.160.0.

## Recursos
- Porto 3D, hangar, árvore tecnológica e progressão por créditos e XP.
- Nautilus, Manta, Kraken, Orca, Triton e Leviathan — seis tiers de pesquisa e variantes de geometria procedural.
- Mergulho e emersão progressivos, bateria e profundidade desejada.
- Academia de treinamento livre, radar tático, sonar e navios em movimento.
- Câmeras externas, torre e periscópio, combate arcade e salvamento local.

## Como executar
Baixe o repositório em Code > Download ZIP, extraia e abra a pasta no VS Code. Execute index.html com Live Server. Alternativamente, execute `python -m http.server 8000` na pasta e abra http://localhost:8000. É necessário acesso à internet para carregar Three.js via CDN.

## Controles
| Tecla | Ação |
|---|---|
| W / S | Acelerar / reduzir |
| A / D | Girar |
| C / X | Emergir / submergir |
| B | Parar |
| R | Sonar |
| M | Mapa tático |
| V | Câmera |
| Tab | Trocar alvo |
| Espaço | Disparar |
| P / Esc | Pausa |
| F1 | Ajuda |

## Documentação
- [Histórico](CHANGELOG.md)
- [Roadmap](ROADMAP.md)
- [Licenciamento](NOTICE.md)

## Estado do projeto
Protótipo em desenvolvimento. Modelos procedurais e parâmetros arcade. Testes de renderização e desempenho em hardware real ainda pendentes.

**Autor do projeto WMK:** Walney Moreira Klein — walneyk@hotmail.com.

## Missões v0.4.0

| Missão | Contatos | Requisito |
|---|---:|---|
| Mar de Hébridas | 3 | Nautilus |
| Comboio perdido | 4 | Manta |
| Horizonte cinzento | 5 | Kraken |
| Operação Abismo | 6 | Leviathan |

Selecione a operação no porto antes de zarpar. Recompensas e tempo variam. Todos os modelos são fictícios e os parâmetros são arcade. A variante Horizonte cinzento ainda não possui clima próprio.

## Licença
MIT para contribuições próprias — veja [LICENSE](LICENSE) e [NOTICE](NOTICE.md).
