# Território

A base territorial local é a fonte padronizada do portal.

- `normalized_name` serve para busca/deduplicação, nunca para apresentação.
- aliases permitem localizar um registro oficial por nomes populares ou grafias sem acento.
- ruas podem se relacionar com mais de um bairro.
- endereço rural pode usar distrito, localidade/comunidade, estrada, km e referência sem exigir CEP individual.
- importação CSV/XLSX exige pré-visualização antes de gravar.
- merge de bairros atualiza referências em uma transação e registra auditoria.
