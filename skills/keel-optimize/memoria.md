# Consolidar a memória persistente

A memória do Claude é uma pasta (`~/.claude/projects/<projecto>/memory/`) com um `.md` por lição e um `MEMORY.md` que é o índice. **O índice carrega-se em todas as sessões**; os restantes, quando são pedidos. Muitas lições de um incidente só, com sobreposição, enchem o índice sem acrescentar nada.

O que se mede e quando compensa: o `medir.mjs` diz o tamanho do índice. Consolidar um índice de 13 KB para 3 KB poupa uns milhares de tokens por chamada — pouco, ao lado de sessões longas. Faz-se por higiene e quando o índice passa de ~100 linhas, e **depois** das conclusões de sessões.

## Procedimento

1. **Cópia de segurança.** `node ${CLAUDE_PLUGIN_ROOT}/skills/keel-optimize/memoria.mjs backup <pasta-memoria>`. Pára se falhar ou se o destino já existir.
2. **Fusão por tema, delegada a um subagente de contexto limpo** (a fusão lê todos os ficheiros; ler tudo na sessão principal custa a cada chamada seguinte). Dá-lhe:
   - a pasta, o destino da cópia e o formato de cada ficheiro (frontmatter `name`, `description`, `metadata.type`; corpo com **Why** e **How to apply**; ligações `[[nome]]`);
   - as regras: **só se juntam ficheiros do mesmo tipo**; cada lição original é uma secção `##` com o corpo literal; só se elimina o duplicado exacto; segredos nunca se copiam; escreve um mapa `antigo.md -> novo.md` com **todos** os originais; só apaga os originais **depois** de o mapa estar completo, um a um, nunca em lote;
   - o objectivo: ficheiros por tema (da ordem de 20) e um índice de poucas dezenas de linhas, uma por ficheiro.
3. **Verificar mecanicamente — o relatório do subagente não chega.**
   ```
   node …/memoria.mjs verificar --antes <backup> --depois <pasta> --mapa <mapa>
   node …/memoria.mjs indice <pasta>
   node …/memoria.mjs segredos <pasta>
   ```
   `verificar` mede a cobertura do texto por sequências de seis palavras, ignorando só a sintaxe das ligações; sai com erro se um original ficar abaixo do mínimo, se faltar uma linha no mapa ou se um destino não existir. Quem fica abaixo do mínimo tem de ser **uma fusão assinalada** (duplicados): lê-a e confirma que os factos únicos sobreviveram.
4. **Dizer o custo ao utilizador.** Os ficheiros novos são maiores: ao recordar uma lição carrega-se o ficheiro todo. Reverter é copiar a cópia de volta.

## O que não se faz

- Fundir tipos diferentes (`feedback` com `project`).
- Reescrever o conteúdo de uma lição para a «melhorar»: aqui só se reagrupa.
- Apagar a cópia de segurança.
