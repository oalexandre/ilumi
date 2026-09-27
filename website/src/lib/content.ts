import type { Locale } from "./site";

export type SceneId = "groceries" | "trip" | "invoice" | "dev" | "dates";

export interface SceneCopy {
  id: Exclude<SceneId, "groceries">;
  title: string;
  body: string;
  /** Describes the clip for screen readers. */
  alt: string;
  /** Index of the line the scene builds up to, highlighted in the transcript. */
  moment: number;
}

export interface ToolkitItem {
  title: string;
  body: string;
  /** Real inputs and the results Ilumi shows for them; omitted when the item isn't an expression. */
  example?: { input: string; result: string }[];
  keys?: string[];
}

export interface Content {
  meta: { title: string; description: string; ogAlt: string };
  nav: { features: string; faq: string; switchLabel: string; switchTo: string; skip: string };
  media: { play: string; pause: string };
  /** caption: "{sum}" marks where the highlighted keyword goes. */
  hero: { title: string; lead: string; alt: string; caption: string; moment: number };
  download: {
    /** "{os}" is replaced with the detected system. */
    cta: string;
    generic: string;
    otherPlatforms: string;
    allReleases: string;
    meta: string;
    macNote: { lead: string; command: string; or: string; settings: string };
  };
  scenes: SceneCopy[];
  toolkit: { title: string; lead: string; items: ToolkitItem[]; themeAlt: string; themeCaption: string };
  faq: { title: string; items: { q: string; a: string }[] };
  close: { title: string; lead: string; github: string; plugins: string; donate: string };
  footer: { madeBy: string; license: string };
}

export const content: Record<Locale, Content> = {
  en: {
    meta: {
      title: "Ilumi — the notepad calculator for macOS, Windows and Linux",
      description:
        "Write calculations like notes and see each answer beside its line: variables, percentages, units, live currency rates, dates and time zones. Free and open source.",
      ogAlt: "An Ilumi note adding up groceries, with each result aligned beside its line",
    },
    nav: { features: "Features", faq: "FAQ", switchLabel: "Português", switchTo: "PT", skip: "Skip to content" },
    media: { play: "Play", pause: "Pause" },
    hero: {
      title: "Math, written like a note.",
      lead: "Type one calculation per line and Ilumi answers beside it, with variables, units, currencies and dates built in. Free and open source for macOS, Windows and Linux.",
      alt: "Typing a grocery list into Ilumi: each price appears on the right, and sum adds them up to 69.2",
      caption: "Every line is a calculation. {sum} adds up the lines above it.",
      moment: 5,
    },
    download: {
      cta: "Download for {os}",
      generic: "Download",
      otherPlatforms: "Other platforms",
      allReleases: "All releases",
      meta: "Free · open source (MIT)",
      macNote: {
        lead: "macOS says Ilumi “cannot be opened”? Run",
        command: "xattr -cr /Applications/Ilumi.app",
        or: "or choose",
        settings: "System Settings → Privacy & Security → Open Anyway",
      },
    },
    scenes: [
      {
        id: "trip",
        moment: 4,
        title: "Money in any currency",
        body: "Add up a trip in euros and see it in dollars. Rates refresh every hour and still work offline, flagged when they may be outdated.",
        alt: "Adding flights, hotel and food in euros, then converting the total to US dollars and splitting it by two",
      },
      {
        id: "invoice",
        moment: 4,
        title: "Percentages the way you say them",
        body: "Name a value once and reuse it. A 5% discount, 15% of the subtotal, plus 8%: Ilumi reads percentages the way you would say them.",
        alt: "An invoice: hours times rate, minus a 5% discount, and 15% tax on the subtotal",
      },
      {
        id: "dev",
        moment: 0,
        title: "For the work in your other window",
        body: "CSS pixels and rems, hex and binary, bitwise operators, data sizes. The scratchpad that stays open next to your editor.",
        alt: "Converting 24 px to rem and back, combining hex values with OR, shifting binary and converting gigabytes to megabytes",
      },
      {
        id: "dates",
        moment: 1,
        title: "Dates and time zones",
        body: "Count the days to a deadline, turn them into hours, and check what time it is in Tokyo or New York. More than 400 time zones.",
        alt: "A deadline three weeks from today, the hours left until it, and the current time in Tokyo and New York",
      },
    ],
    toolkit: {
      title: "The rest of the toolkit",
      lead: "Small things that make it the calculator you keep open.",
      items: [
        {
          title: "Always one shortcut away",
          body: "Show or hide Ilumi from any app. Keep it on top of other windows if you like.",
          keys: ["Cmd/Ctrl", "Alt", "Space"],
        },
        {
          title: "Refer to the lines above",
          body: "sum, avg, prev and count work on the results above, so totals never need retyping.",
          example: [
            { input: "10 + 20", result: "30" },
            { input: "prev * 2", result: "60" },
          ],
        },
        {
          title: "200+ units",
          body: "Length, weight, volume, area, temperature, time, data and CSS units, converted with in.",
          example: [{ input: "100 °C in °F", result: "212 °F" }],
        },
        {
          title: "Functions and constants",
          body: "Square roots, rounding, trigonometry and logarithms, with pi and e ready to use.",
          example: [{ input: "round(10 / 3, 2)", result: "3.33" }],
        },
        {
          title: "Your number format",
          body: "Choose 1,234.56, 1.234,56 or 1 234,56, and how many decimal places to show.",
        },
        {
          title: "Notes in tabs",
          body: "One note per project or errand. Everything saves as you type.",
        },
        {
          title: "Plugins",
          body: "Add your own units, functions and constants with a small JavaScript file.",
        },
        {
          title: "Share as an image",
          body: "Copy a note as a picture, ready to paste into a chat or an email.",
        },
      ],
      themeAlt: "The same grocery note in Ilumi's light theme",
      themeCaption: "Dark or light, following your system.",
    },
    faq: {
      title: "Questions",
      items: [
        {
          q: "Is Ilumi free?",
          a: "Yes. Ilumi is free and open source under the MIT license. Donations help, but nothing is locked behind them.",
        },
        {
          q: "Which systems does it run on?",
          a: "macOS (Apple Silicon and Intel), Windows (64-bit and ARM) and Linux (.deb and AppImage, for x64 and ARM).",
        },
        {
          q: "macOS says Ilumi “cannot be opened”. What now?",
          a: "Ilumi is not signed with an Apple Developer ID yet, so macOS blocks the first launch. Run xattr -cr /Applications/Ilumi.app in Terminal, or open System Settings → Privacy & Security and choose Open Anyway.",
        },
        {
          q: "Does it need an internet connection?",
          a: "No. Calculations run on your computer and notes are saved locally. The internet is used only to refresh exchange rates and check for updates; offline, Ilumi uses the last known rates and marks results that may be outdated.",
        },
        {
          q: "Can I add my own units or functions?",
          a: "Yes. Plugins are small JavaScript files that add units, functions and constants. The plugin guide on GitHub shows how.",
        },
      ],
    },
    close: {
      title: "Open a note. Start counting.",
      lead: "Ilumi is built in the open. Report a bug, suggest a feature or write a plugin.",
      github: "Source on GitHub",
      plugins: "Plugin guide",
      donate: "Donate",
    },
    footer: { madeBy: "Made by", license: "Open source, MIT license" },
  },

  pt: {
    meta: {
      title: "Ilumi — a calculadora em formato de nota para macOS, Windows e Linux",
      description:
        "Escreva contas como anotações e veja cada resultado ao lado da linha: variáveis, porcentagens, unidades, cotações de moedas, datas e fusos horários. Gratuito e de código aberto.",
      ogAlt: "Uma nota do Ilumi somando as compras do mercado, com cada resultado alinhado ao lado da linha",
    },
    nav: { features: "Recursos", faq: "Perguntas", switchLabel: "English", switchTo: "EN", skip: "Pular para o conteúdo" },
    media: { play: "Reproduzir", pause: "Pausar" },
    hero: {
      title: "Contas escritas como uma nota.",
      lead: "Escreva uma conta por linha e o Ilumi responde ao lado, com variáveis, unidades, moedas e datas. Gratuito e de código aberto para macOS, Windows e Linux.",
      alt: "Digitando a lista do mercado no Ilumi: cada preço aparece à direita e o sum soma tudo, 69,2",
      caption: "Cada linha é uma conta. O {sum} soma as linhas de cima.",
      moment: 5,
    },
    download: {
      cta: "Baixar para {os}",
      generic: "Baixar",
      otherPlatforms: "Outras plataformas",
      allReleases: "Todas as versões",
      meta: "Gratuito · código aberto (MIT)",
      macNote: {
        lead: "O macOS diz que o Ilumi “não pode ser aberto”? Rode",
        command: "xattr -cr /Applications/Ilumi.app",
        or: "ou escolha",
        settings: "Ajustes do Sistema → Privacidade e Segurança → Abrir Mesmo Assim",
      },
    },
    scenes: [
      {
        id: "trip",
        moment: 4,
        title: "Dinheiro em qualquer moeda",
        body: "Some a viagem em euros e veja em reais. As cotações são atualizadas a cada hora e continuam funcionando offline, com aviso quando podem estar desatualizadas.",
        alt: "Somando voos, hotel e comida em euros, convertendo o total para reais e dividindo por dois",
      },
      {
        id: "invoice",
        moment: 4,
        title: "Porcentagem do jeito que se fala",
        body: "Dê nome a um valor e use de novo. Desconto de 5%, 15% sobre o subtotal, mais 8%: o Ilumi entende porcentagem como uma pessoa.",
        alt: "Um orçamento: horas vezes valor, menos 5% de desconto e 15% de imposto sobre o subtotal",
      },
      {
        id: "dev",
        moment: 0,
        title: "Para o trabalho na outra janela",
        body: "px e rem do CSS, hexadecimal e binário, operadores bit a bit, tamanhos de arquivo. O rascunho que fica aberto ao lado do seu editor.",
        alt: "Convertendo 24 px para rem e de volta, combinando hexadecimais com OR, deslocando binários e convertendo gigabytes em megabytes",
      },
      {
        id: "dates",
        moment: 1,
        title: "Datas e fusos horários",
        body: "Conte os dias até o prazo, transforme em horas e veja que horas são em Tóquio ou em São Paulo. Mais de 400 fusos horários.",
        alt: "Um prazo daqui a três semanas, as horas que faltam até ele e a hora atual em Tóquio e em São Paulo",
      },
    ],
    toolkit: {
      title: "O resto da caixa de ferramentas",
      lead: "Detalhes que fazem dele a calculadora que fica aberta.",
      items: [
        {
          title: "Sempre a um atalho",
          body: "Mostre ou esconda o Ilumi de qualquer app. Se quiser, deixe-o por cima das outras janelas.",
          keys: ["Cmd/Ctrl", "Alt", "Espaço"],
        },
        {
          title: "Use as linhas de cima",
          body: "sum, avg, prev e count trabalham com os resultados acima, sem redigitar nada.",
          example: [
            { input: "10 + 20", result: "30" },
            { input: "prev * 2", result: "60" },
          ],
        },
        {
          title: "Mais de 200 unidades",
          body: "Comprimento, peso, volume, área, temperatura, tempo, dados e unidades de CSS, convertidos com in.",
          example: [{ input: "100 °C in °F", result: "212 °F" }],
        },
        {
          title: "Funções e constantes",
          body: "Raiz quadrada, arredondamento, trigonometria e logaritmos, com pi e e prontos para usar.",
          example: [{ input: "round(10 / 3, 2)", result: "3,33" }],
        },
        {
          title: "Seu formato de número",
          body: "Escolha 1,234.56, 1.234,56 ou 1 234,56, e quantas casas decimais mostrar.",
        },
        {
          title: "Notas em abas",
          body: "Uma nota por projeto ou tarefa. Tudo é salvo enquanto você digita.",
        },
        {
          title: "Plugins",
          body: "Adicione suas próprias unidades, funções e constantes com um pequeno arquivo JavaScript.",
        },
        {
          title: "Compartilhe como imagem",
          body: "Copie uma nota como figura, pronta para colar numa conversa ou num e-mail.",
        },
      ],
      themeAlt: "A mesma nota do mercado no tema claro do Ilumi",
      themeCaption: "Escuro ou claro, acompanhando o sistema.",
    },
    faq: {
      title: "Perguntas",
      items: [
        {
          q: "O Ilumi é gratuito?",
          a: "Sim. O Ilumi é gratuito e de código aberto, sob a licença MIT. Doações ajudam, mas nada fica bloqueado sem elas.",
        },
        {
          q: "Em quais sistemas ele funciona?",
          a: "macOS (Apple Silicon e Intel), Windows (64 bits e ARM) e Linux (.deb e AppImage, para x64 e ARM).",
        },
        {
          q: "O macOS diz que o Ilumi “não pode ser aberto”. E agora?",
          a: "O Ilumi ainda não é assinado com um Apple Developer ID, então o macOS bloqueia a primeira abertura. Rode xattr -cr /Applications/Ilumi.app no Terminal, ou abra Ajustes do Sistema → Privacidade e Segurança e escolha Abrir Mesmo Assim.",
        },
        {
          q: "Precisa de internet?",
          a: "Não. As contas rodam no seu computador e as notas ficam salvas nele. A internet só é usada para atualizar as cotações e procurar atualizações; offline, o Ilumi usa as últimas cotações conhecidas e marca os resultados que podem estar desatualizados.",
        },
        {
          q: "Posso escrever as contas em português?",
          a: "Os resultados podem sair no formato brasileiro (1.234,56), mas a escrita ainda usa palavras em inglês, como in, of, sum e today, e o ponto como separador decimal.",
        },
        {
          q: "Posso criar minhas próprias unidades ou funções?",
          a: "Sim. Plugins são pequenos arquivos JavaScript que adicionam unidades, funções e constantes. O guia de plugins no GitHub mostra como.",
        },
      ],
    },
    close: {
      title: "Abra uma nota e comece a contar.",
      lead: "O Ilumi é feito às claras. Reporte um bug, sugira um recurso ou escreva um plugin.",
      github: "Código no GitHub",
      plugins: "Guia de plugins",
      donate: "Doar",
    },
    footer: { madeBy: "Feito por", license: "Código aberto, licença MIT" },
  },
};
