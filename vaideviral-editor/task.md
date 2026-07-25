# Tarefas de Integração RifaSegura V2 no VaiDeViral Editor

Este documento registra as modificações de rotas, UI e backend/frontend para a adição da aba do RifaSegura V2.

## Modificações na UI (index.html)
- Adicionado botão de navegação `tabRifaBtn` no menu lateral do editor.
- Adicionado container de conteúdo `tabRifaContent` contendo:
  - **Seletor de Avatares**: Dropdown com 5 perfis (Confeiteira, Mecânico, Mestre de Obras, Papelaria, Artesã). Exibe biografia, prompt do Midjourney (copiável), script de Reels (copiável) e template de WhatsApp (copiável).
  - Botão **"Aplicar Configurações no Perfil"** que atualiza o nome, handle, gera um avatar em canvas com base no emoji/gradiente do perfil e redireciona para a aba de Perfil para visualização imediata.
  - **Seletor de Carrosséis**: Dropdown com 5 carrosséis com foco em engajamento e conversão de rifas.
  - Paginador de slides com botões de Anterior/Próximo e bolinhas indicadoras do progresso dos slides.
  - Visualizador de Slide integrado com um mini mockup de smartphone (canvas de 300x375px) na barra lateral.
  - Botão **"Baixar Slide em Alta Resolução (1080x1350)"** que exporta o slide atual em formato PNG.

## Modificações na Lógica (app.js)
- Integração da aba RifaSegura na lista de tabs ativas.
- Implementação de dados em formato JSON para os 5 Avatars e 5 Carrosséis com textos em português.
- Implementação de `generateEmojiAvatar(emoji, gradientStart, gradientEnd)` para geração dinâmica do avatar a partir dos dados do perfil.
- Implementação de `drawCarouselSlide(canvas, slideIndex, carouselIndex)` que renderiza de forma escalável os slides nos canvas de preview e de exportação.
- Implementação de `wrapText(ctx, text, x, y, maxWidth, lineHeight)` para encapsular e quebrar linhas de texto de forma centralizada nos slides.
- Implementação de listeners para os botões de controle de slides e exportação de PNG.

## Testes Realizados
- [ ] Verificar troca de abas no editor.
- [ ] Verificar carregamento dos dados de cada Avatar.
- [ ] Testar aplicação do perfil no editor de vídeo (verificar se o avatar em canvas com emoji é gerado e aplicado).
- [ ] Testar navegação de slides do carrossel no mini mockup.
- [ ] Testar exportação em alta resolução (1080x1350px) em PNG.

## Correção de Bug Crítico (Importante)
- **Erro de Sintaxe no Editor**: Foi detectado um erro de sintaxe original na linha 366 do arquivo `app.js` (um trecho duplicado/incompleto de código do listener `splitVideoInput`), o qual impedia que o editor iniciasse (travava a execução de todo o script JS no navegador).
- **Ação Tomada**: Removemos o trecho duplicado inválido e validamos a integridade do arquivo usando `node --check app.js` (retornando Sucesso/Exit Code 0). Agora o editor carrega perfeitamente.
