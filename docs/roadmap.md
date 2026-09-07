# Roadmap

Ideias de evolução do Ilumi, organizadas por retorno pelo esforço. Este documento
é uma lista de sugestões, não um compromisso. Atualizado em 2026-09-07.

Legenda: ✅ feito · 🔨 em andamento · 💡 sugerido

## Feito

### ✅ Feedback de erro enquanto digita

Enquanto o usuário digita numa linha com erro, o painel mostra três pontos
pulsando em vez de "Syntax error". Enter numa linha com erro de sintaxe revela o
erro e mantém o cursor na linha; um segundo Enter cria a linha nova. Erros de
avaliação (divisão por zero, variável indefinida) são mostrados mas não
bloqueiam. Sair da linha por setas, clique ou perda de foco revela o erro.

### ✅ Atalho global e janela flutuante

Um atalho de teclado que funciona em qualquer app (padrão `Cmd/Ctrl+Alt+Space`)
mostra ou esconde o Ilumi, e uma opção "sempre no topo" mantém a janela sobre as
outras. É a feature de assinatura de calculadoras de bloco de notas: a pessoa
abre, calcula, fecha, sem sair do que estava fazendo. O tray já existe e serve de
âncora.

- Atalho configurável nas configurações, com gravação da combinação. Se o sistema
  recusar a combinação, a anterior é mantida.
- "Sempre no topo" como toggle; no macOS a janela aparece também sobre apps em
  tela cheia.
- Ambos persistidos em `settings.json`.

### ✅ Formato de número e precisão nas configurações

O painel de configurações só tinha tema. O formatador já aceita `locale`, mas
estava fixo em `en-US`, então um usuário brasileiro via `1,234.56` em vez de
`1.234,56`.

- Formato: `1,234.56` (en-US), `1.234,56` (pt-BR) ou `1 234,56` (fr-FR).
- Casas decimais: automático (padrão) ou um máximo fixo de 0 a 10.
- Separador de milhar: liga/desliga.
- Ícone de engrenagem no canto inferior direito abre o painel.

Só a saída muda. A entrada continua usando ponto como separador decimal; aceitar
vírgula na digitação está na lista de sugestões (ver "Palavras-chave em
português").

### ✅ Autocomplete de variáveis do próprio documento

O autocomplete cobre unidades, funções e constantes, mas não as variáveis que o
usuário definiu nas linhas acima. É onde a pessoa mais erra o nome. As variáveis
definidas acima da linha atual passam a aparecer no topo da lista.

## Sugeridas (roadmap futuro)

### 💡 Clicar no resultado insere referência

Clicar num resultado copia. Um clique com modificador (ou arrastar o valor para o
editor) inseriria a variável ou `line N` no ponto do cursor. Transforma o painel
direito em algo interativo em vez de só leitura.

### 💡 Seções e subtotais

Hoje `# título` vira apenas comentário. Tratar como cabeçalho de seção e fazer
`sum` e `total` respeitarem a seção resolve o caso clássico de orçamento com
blocos (receitas, despesas fixas, despesas variáveis). Um `total` fora de seção
continuaria somando tudo.

### 💡 Representações alternativas ao passar o mouse

Hover no resultado mostra o mesmo valor em hex e binário, ou em duas ou três
unidades vizinhas (km → mi, m; GB → MB, GiB). Zero mudança de sintaxe, só UI.

### 💡 Erro apontando o token

O parser descarta a posição do erro do Peggy (`catch` vazio em `document.ts`).
Com ela dá para sublinhar no editor exatamente onde a expressão quebrou, no
estilo de linter. Complementa o feedback de erro já feito.

### 💡 Palavras-chave em português

`hoje + 2 semanas`, `15% de 250`, `em reais`, `1.234,56` na entrada. Diferencia o
Ilumi do Numi para o público brasileiro. É a maior das ideias de sintaxe porque
mexe na gramática PEG e no formatador de entrada; provavelmente vale começar por
um conjunto pequeno de palavras (`de`, `em`, `hoje`, `amanhã`, `semana`, `mês`).

### 💡 Linha de comando

O engine é TypeScript puro sem dependência do Electron, então um
`ilumi "5 km in miles"` sai quase de graça. Abre porta para Raycast, Alfred,
scripts de shell e integração com outros apps.

### 💡 Busca entre notas

Com muitas abas, um `Cmd+P` para pular por nome ou por conteúdo da nota.

### 💡 Exportar nota como texto ou Markdown

Já existe "compartilhar como imagem". A versão texto, com expressão e resultado
lado a lado, é o que as pessoas colam em e-mail ou chat. Pode reaproveitar o
"Copy All Results" do menu.

### 💡 Port do engine para Rust

Avaliado e descartado por enquanto. O engine leva ~0,4 ms para reavaliar um
documento de 50 linhas e ~8,6 ms para 1000 linhas; o debounce de 50 ms e o IPC
custam mais que o cálculo. Só faria sentido junto com uma troca do Electron por
Tauri para reduzir o tamanho do binário, o que é um projeto bem maior.

## Manutenção

- `pnpm build` regenera `arithmetic-parser.js` com formatação diferente da
  commitada. Vale fixar a versão do Peggy ou rodar o Prettier no arquivo gerado
  como parte do build.
- Há 28 arquivos fora do padrão do Prettier no repositório. Um `pnpm format`
  único resolve, de preferência num commit isolado.
