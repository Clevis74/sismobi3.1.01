# 📋 GUIA DE MANUTENÇÃO - VERSION.md

## 🎯 **OBJETIVO**
Manter consistência e qualidade na documentação de versões do SISMOBI, garantindo que todas as seções sejam renderizadas corretamente no preview da interface para validação e comunicação com stakeholders.

## 📝 **ESTRUTURA OBRIGATÓRIA**

### 1. **Cabeçalho Principal**
```markdown
# 📋 Controle de Versões - SISMOBI
## 🏷️ Versão Atual: **X.X.X**
```

### 2. **Seções Essenciais (ORDEM FIXA):**

#### A. **📅 Histórico de Versões**
- Versão atual sempre primeiro
- Formato: `#### **vX.X.X** - Nome (Data) - **STATUS! 🚀**`
- Lista detalhada de implementações com ✅

#### B. **🔗 ENDPOINTS API vX.X.X**
- Todos os endpoints organizados por categoria
- Formato: `- \`METHOD /path\` - Descrição`
- Sempre atualizar com novas APIs

#### C. **🏗️ Componentes e Suas Versões**
- Tabela com todos os componentes e versões
- Manter alinhamento da tabela markdown

#### D. **🛠️ Stack Tecnológico**
- Tabela atualizada com todas as tecnologias
- Versões específicas quando possível

#### E. **🧪 STATUS DE FUNCIONAMENTO**
- Backend e Frontend status
- Lista detalhada com ✅/❌

#### F. **📈 Próximas Versões Planejadas**
- Roadmap das próximas 3 versões
- Itens com [ ] para pending, [x] para done

#### G. **🔄 Comandos Úteis**
- Scripts e comandos para desenvolvimento
- Sempre testar os comandos antes de documentar

#### H. **🎉 CONQUISTAS vX.X.X**
- Seção de destaque das principais implementações
- Organizado por categorias (Backend, Frontend, etc.)

### 3. **Rodapé Obrigatório**
```markdown
**📝 Nota**: Este arquivo é atualizado automaticamente a cada release.
**🏷️ Versão Sistema**: SISMOBI X.X.X  
**📅 Última Atualização**: Mês Ano  
**🎯 Status**: Status Atual Descriptivo
```

## ✅ **CHECKLIST DE VALIDAÇÃO**

### **Antes de Atualizar:**
- [ ] Backup da versão anterior
- [ ] Testar todos os endpoints mencionados
- [ ] Verificar comandos úteis funcionam
- [ ] Confirmar versões do stack tecnológico

### **Durante a Atualização:**
- [ ] Manter estrutura obrigatória
- [ ] Usar substituição completa, não incremental
- [ ] Validar markdown tables estão corretas
- [ ] Verificar emojis e formatação

### **Após Atualização:**
- [ ] Executar `npm run version-check`
- [ ] Visualizar arquivo completo com `view_file`
- [ ] Confirmar renderização no preview
- [ ] Testar endpoints mencionados
- [ ] Validar com stakeholders se necessário

## 🚨 **ERROS COMUNS A EVITAR**

1. **❌ Atualização Parcial**
   - Sempre usar `search_replace` completo
   - Nunca fazer mudanças incrementais
   
2. **❌ Inconsistência de Versões**
   - Verificar todas as referências de versão
   - Atualizar package.json simultaneamente
   
3. **❌ Quebra de Tabelas Markdown**
   - Manter alinhamento das colunas
   - Verificar pipes `|` estão corretos
   
4. **❌ Comandos Desatualizados**
   - Testar todos os comandos antes de documentar
   - Remover comandos que não funcionam mais

## 📊 **PROCESSO DE RELEASE**

### **Para Nova Versão (X.X.X):**

1. **Preparação:**
   ```bash
   # Testar backend
   curl http://localhost:8001/api/health
   
   # Testar frontend  
   curl http://localhost:5174
   
   # Verificar serviços
   sudo supervisorctl status
   ```

2. **Atualização VERSION.md:**
   - Criar nova seção vX.X.X no topo
   - Mover versão anterior para histórico
   - Atualizar todas as tabelas
   - Revisar próximas versões

3. **Sincronização:**
   - Atualizar package.json version
   - Atualizar comando version-check
   - Testar integração completa

4. **Validação:**
   - Executar checklist completo
   - Confirmar preview renderização
   - Comunicar stakeholders

## 🔧 **COMANDOS DE MANUTENÇÃO**

```bash
# Verificar versão atual
npm run version-check

# Validar arquivo completo
cat VERSION.md | head -20

# Testar backend health
curl -s http://localhost:8001/api/health | python -m json.tool

# Status serviços
sudo supervisorctl status

# Backup antes de mudanças
cp VERSION.md VERSION.md.backup
```

## 📞 **COMUNICAÇÃO COM STAKEHOLDERS**

### **Quando Comunicar:**
- ✅ Nova versão major (X.0.0)
- ✅ Backend/Frontend expansion completo
- ✅ Mudanças que afetam integração
- ✅ Milestones importantes alcançados

### **Como Comunicar:**
- Preview do VERSION.md sempre atualizado
- Destacar seção "CONQUISTAS vX.X.X"
- Mencionar próximos passos claros
- Status de funcionamento transparente

---

**🎯 OBJETIVO FINAL:** Garantir que o VERSION.md seja sempre uma fonte confiável, completa e atualizada do estado atual do projeto SISMOBI, mantendo comunicação transparente com todos os stakeholders através de renderização perfeita no preview da interface.

---

**📝 Criado em:** Julho 2025  
**🔄 Última Revisão:** v3.2.0  
**👥 Responsável:** Equipe de Desenvolvimento SISMOBI