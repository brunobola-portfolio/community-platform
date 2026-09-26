# pages/admin — regras do backoffice

Carrega só a trabalhar nesta pasta. As regras gerais (Convex, styling, standards) estão no
`AGENTS.md` da raiz.

- **Backoffice é dark-only e declara-o**: a raiz do `/admin` e do `/setup` tem a classe
  `dark`, por isso os componentes partilhados (diálogos, inputs, estados vazios) seguem o
  tema escuro mesmo quando o visitante tem o portal em claro — sem isso, as variantes
  `dark:` não se aplicavam e o backoffice ficava com texto escuro sobre fundo escuro.
- **Listas do backoffice têm um único componente**: `pages/admin/components/EntityList.tsx`
  (toolbar de pesquisa/filtros/ordenação, tabela desktop, cartões mobile, estado vazio da
  coleção e estado sem resultados, com as MESMAS ações nas duas vistas). Uma tab nova é uma
  configuração de colunas — nunca uma tabela nova.
- **Campos do backoffice usam `pages/admin/components/Field.tsx`**: gera o `id`, liga o
  `label` e marca os obrigatórios. Nunca escrever `<label className={LABEL_CLASS}>` solto
  ao lado de um input; um `<span>` com essa classe só serve para títulos de grupo.
