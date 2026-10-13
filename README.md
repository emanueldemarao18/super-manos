# Super Manos

Jogos de browser com a malta como personagens: o Emanuel, o Leonardo, o Walgídio, o Dave, o Diego, o Naftali, o Atircio, o Daniel, o Álvaro, o Cleusio e o Cristiano.

Feito em JavaScript puro com `<canvas>`. Não há dependências nem passo de build.

## Jogos

### Super Manos — Torneio de Rua (jogo de luta) · *em construção*
Luta 1 contra 1 ao estilo Street Fighter/Tekken. Está na raiz do repo: abre `index.html`.

- **Modos:** Arcade contra o CPU, Versus com um amigo (no mesmo teclado ou com comandos), Contra CPU com dificuldade à escolha, e Treino.
- **Lutadores:** cada mano tem um estilo de luta, golpes especiais e um super próprios.

### Super Manos (plataformas)
Plataformas ao estilo Mario, com 4 níveis. Abre `platformer/index.html`.

| Tecla | Ação |
|---|---|
| ← → / A D | andar |
| Z / Espaço / K | saltar (segurar = salto mais alto) |
| X / Shift / J | correr |
| Enter | confirmar / pausa |
| M | sem som |

Poderes especiais: Naftali tem salto duplo, Dave plana no ar, Walgídio puxa as moedas com um íman e Atircio aguenta um toque.

## Como correr

Basta abrir o `index.html` no browser. Se preferires um servidor local:

```sh
python3 -m http.server 8000
# depois abre http://localhost:8000
```

## Estrutura

```
index.html, src/      jogo de luta
platformer/           jogo de plataformas
scripts/smoke_test.sh verificação rápida (sintaxe + scripts carregados)
AGENTS.md             regras para quem (ou o quê) trabalha no repo
```

## Contribuir

Lê o `AGENTS.md`. Resumindo: commits pequenos e bem descritos, corre `scripts/smoke_test.sh` antes de cada push, e um agente por pasta.
