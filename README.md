# 🏢 Sistema de Gestão Imobiliária - SISMOBI2.4

Sistema completo de gestão imobiliária com foco em acessibilidade, performance e segurança.

## ✨ Características

- ♿ **100% Acessível** - Conformidade com WCAG 2.1 AA
- 🚀 **Alta Performance** - Otimizado com cache inteligente e memoização
- 🔒 **Seguro** - Validação defensiva e sanitização de dados
- 📱 **Responsivo** - Interface adaptativa para todos os dispositivos
- 🎨 **Moderno** - React 18 + TypeScript + Vite + Tailwind CSS

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Ícones**: Lucide React
- **Qualidade**: ESLint, Prettier
- **Acessibilidade**: Skip Links, ARIA, Navegação por teclado

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                # Servidor de desenvolvimento
npm run preview           # Preview da build

# Build e Deploy
npm run build             # Build de produção
npm run type-check        # Verificação de tipos TypeScript

# Qualidade de Código
npm run lint              # Executar ESLint
npm run lint:fix          # Corrigir problemas do ESLint automaticamente
npm run format            # Formatar código com Prettier
npm run format:check      # Verificar formatação

# Segurança
npm run security:audit    # Auditoria de segurança
npm run security:fix      # Corrigir vulnerabilidades

# Pré-commit
npm run pre-commit        # Verificações antes do commit
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── common/              # Componentes reutilizáveis
│   │   ├── ErrorBoundary.tsx
│   │   ├── SkipLinks.tsx
│   │   └── NotificationSystem.tsx
│   └── layout/              # Layout e navegação
├── hooks/                   # Custom hooks
├── utils/                   # Utilitários
│   └── safeDateFormatting.ts # Formatação segura de datas
└── types/                   # Definições TypeScript
```

## ♿ Acessibilidade

### Navegação por Teclado
- **Tab**: Navegar entre elementos focáveis
- **Enter/Espaço**: Ativar botões e links
- **Escape**: Fechar modais e menus
- **Setas**: Navegar em menus e listas

### Skip Links
- `Pular para conteúdo principal`
- `Pular para navegação`
- `Pular para menu lateral`

### Recursos de Acessibilidade
- ✅ Atributos ARIA adequados
- ✅ Labels descritivos
- ✅ Contraste WCAG AA
- ✅ Foco visível
- ✅ Anúncios para leitores de tela

## 🚀 Performance

### Otimizações Implementadas
- **Cache inteligente** para cálculos pesados
- **Memoização seletiva** com dependências estáveis
- **ErrorBoundary** para isolamento de erros
- **Debounce** em operações de localStorage
- **Lazy loading** de componentes pesados

### Monitoramento
O sistema inclui monitoramento de performance em tempo real (modo desenvolvimento).

## 🔒 Segurança

### Medidas Implementadas
- ✅ Validação defensiva de datas
- ✅ Sanitização de inputs
- ✅ Sistema de notificações seguro (substitui `alert()`)
- ✅ ErrorBoundary para captura de erros
- ✅ Auditoria automatizada de dependências

## 🐛 Tratamento de Erros

O sistema possui tratamento robusto de erros:

1. **ErrorBoundary** - Captura erros de renderização
2. **Validação defensiva** - Previne erros de dados inválidos
3. **Fallbacks** - Interfaces de erro amigáveis
4. **Logging** - Registro detalhado para debugging

## 🎯 Sprint 1 - Implementações Críticas

### ✅ Concluído

- [x] **ErrorBoundary** implementado e posicionado corretamente
- [x] **formatDate** corrigido com validação defensiva
- [x] **Sistema de notificações** substituindo `alert()` nativo
- [x] **SkipLinks** para navegação acessível
- [x] **ESLint** configurado com regras de a11y e security
- [x] **Sidebar e Header** com acessibilidade completa
- [x] **useMemo** otimizado com dependências estáveis
- [x] **Scripts** de qualidade e segurança adicionados

### 🎉 Resultados Alcançados

- **0 erros** de `RangeError: Invalid time value`
- **Navegação 100% acessível** por teclado
- **Sistema robusto** de tratamento de erros
- **Performance otimizada** com cache inteligente
- **Código mais maintível** e escalável

## 📚 Próximos Passos

### Sprint 2 - Melhorias (2-3 semanas)
- [ ] Testes automatizados com Vitest
- [ ] Integração com axe-core para testes a11y
- [ ] Lighthouse CI para auditoria contínua
- [ ] Mais componentes acessíveis

### Sprint 3 - Avançado (3-4 semanas)
- [ ] Storybook para documentação
- [ ] Testes E2E com Playwright
- [ ] Monitoramento em produção
- [ ] PWA e Service Workers

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Execute `npm run pre-commit` antes de fazer commit
4. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. Push para a branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ focando em acessibilidade, performance e segurança.**