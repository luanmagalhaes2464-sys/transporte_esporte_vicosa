"use client";
import { useEffect, useMemo, useState } from "react";
import { TerritoryMap } from "@/components/TerritoryMap";

type Neighborhood = { id: string; name: string; type: string; active: boolean; latitude?: string | number | null; longitude?: string | number | null };
type District = { id: string; name: string; active: boolean; latitude?: string | number | null; longitude?: string | number | null };
type Street = { id: string; name: string; cep?: string | null; active: boolean; latitude?: string | number | null; longitude?: string | number | null; neighborhoods: Array<{ neighborhood: Neighborhood }> };
type RuralLocality = { id: string; name: string; popularName?: string | null; active: boolean; latitude?: string | number | null; longitude?: string | number | null; district?: District | null };
type AliasRow = { id:string; entityType:"NEIGHBORHOOD"|"RURAL_LOCALITY"|"STREET"|"DISTRICT"; entityId:string; alias:string; targetName:string };
type Tab = "Bairros" | "Ruas" | "Localidades rurais" | "Distritos" | "Aliases" | "Mapa" | "Importação";

async function api(url: string, init?: RequestInit) {
  const r = await fetch(url, init); const body = await r.json();
  if (!r.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body;
}

export function TerritoryAdmin() {
  const [tab, setTab] = useState<Tab>("Bairros");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [rural, setRural] = useState<RuralLocality[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [aliases, setAliases] = useState<AliasRow[]>([]);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  async function load() {
    const [n, s, r, d, a] = await Promise.all([
      api("/api/territory/neighborhoods"), api("/api/territory/streets"), api("/api/territory/rural-localities"), api("/api/territory/districts"), api("/api/territory/aliases")
    ]);
    setNeighborhoods(n); setStreets(s); setRural(r); setDistricts(d); setAliases(a);
  }
  useEffect(() => { load().catch(e => setMsg(e.message)); }, []);

  const visibleNeighborhoods = useMemo(() => neighborhoods.filter(x => x.name.toLowerCase().includes(query.toLowerCase())), [neighborhoods, query]);
  const visibleStreets = useMemo(() => streets.filter(x => x.name.toLowerCase().includes(query.toLowerCase())), [streets, query]);
  const visibleRural = useMemo(() => rural.filter(x => x.name.toLowerCase().includes(query.toLowerCase())), [rural, query]);

  async function createNeighborhood(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    try { await api("/api/territory/neighborhoods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name"), type: f.get("type") }) }); setMsg("Bairro criado."); e.currentTarget.reset(); await load(); } catch (e) { setMsg(e instanceof Error ? e.message : "Erro."); }
  }

  async function mergeNeighborhood() {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) { setMsg("Selecione dois bairros diferentes."); return; }
    const source = neighborhoods.find(x => x.id === mergeSource); const target = neighborhoods.find(x => x.id === mergeTarget);
    if (!source || !target || !window.confirm(`Mesclar “${source.name}” em “${target.name}”? Os vínculos serão atualizados e o registro de origem será desativado.`)) return;
    try { await api("/api/territory/merge", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({sourceId:mergeSource,targetId:mergeTarget}) }); setMsg(`“${source.name}” foi mesclado em “${target.name}”.`); setMergeSource(""); setMergeTarget(""); await load(); } catch(e){ setMsg(e instanceof Error ? e.message : "Erro ao mesclar."); }
  }

  async function createDistrict(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    try { await api("/api/territory/districts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name") }) }); setMsg("Distrito criado."); e.currentTarget.reset(); await load(); } catch (e) { setMsg(e instanceof Error ? e.message : "Erro."); }
  }

  async function createStreet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    try { await api("/api/territory/streets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name"), type: f.get("type") || undefined, cep: f.get("cep") || undefined, neighborhoodIds: f.getAll("neighborhoodIds") }) }); setMsg("Rua criada."); e.currentTarget.reset(); await load(); } catch (e) { setMsg(e instanceof Error ? e.message : "Erro."); }
  }

  async function createRural(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    try { await api("/api/territory/rural-localities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name"), popularName: f.get("popularName") || undefined, region: f.get("region") || undefined, districtId: f.get("districtId") || undefined }) }); setMsg("Localidade rural criada."); e.currentTarget.reset(); await load(); } catch (e) { setMsg(e instanceof Error ? e.message : "Erro."); }
  }

  async function rename(kind: "neighborhoods" | "streets" | "rural-localities" | "districts", id: string, currentName: string) {
    const name = window.prompt("Nome oficial", currentName)?.trim();
    if (!name || name === currentName) return;
    try { await api(`/api/territory/${kind}/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name}) }); setMsg("Nome oficial atualizado."); await load(); } catch(e){ setMsg(e instanceof Error ? e.message : "Erro ao editar."); }
  }

  async function toggle(kind: "neighborhoods" | "streets" | "rural-localities" | "districts", id: string, active: boolean) {
    try { await api(`/api/territory/${kind}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) }); setMsg(!active ? "Registro reativado." : "Registro desativado."); await load(); } catch (e) { setMsg(e instanceof Error ? e.message : "Erro."); }
  }


  async function createAlias(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    try { await api("/api/territory/aliases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType: f.get("entityType"), entityId: f.get("entityId"), alias: f.get("alias") }) }); setMsg("Alias criado."); e.currentTarget.reset(); await load(); } catch (e) { setMsg(e instanceof Error ? e.message : "Erro."); }
  }

  async function previewFile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try { const f = new FormData(e.currentTarget); setPreview(await api("/api/territory/import/preview", { method: "POST", body: f })); } catch (e) { setMsg(e instanceof Error ? e.message : "Erro ao ler arquivo."); }
  }
  async function commit() {
    try { const result = await api("/api/territory/import/commit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: preview.rows.filter((x: any) => x.status === "NEW") }) }); setMsg(`${result.created} registros importados.`); setPreview(null); await load(); } catch (e) { setMsg(e instanceof Error ? e.message : "Erro ao importar."); }
  }

  const tabs: Tab[] = ["Bairros", "Ruas", "Localidades rurais", "Distritos", "Aliases", "Mapa", "Importação"];
  const mapPoints = [
    ...neighborhoods.filter(x=>x.latitude!=null&&x.longitude!=null).map(x=>({id:x.id,lat:Number(x.latitude),lng:Number(x.longitude),label:x.name,kind:"Bairro"})),
    ...rural.filter(x=>x.latitude!=null&&x.longitude!=null).map(x=>({id:x.id,lat:Number(x.latitude),lng:Number(x.longitude),label:x.name,kind:"Localidade rural"})),
    ...streets.filter(x=>x.latitude!=null&&x.longitude!=null).map(x=>({id:x.id,lat:Number(x.latitude),lng:Number(x.longitude),label:x.name,kind:"Logradouro"}))
  ];
  return <div style={{ display: "grid", gap: 20 }}>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{tabs.map(t => <button key={t} type="button" className={tab === t ? "btn-primary" : "btn-secondary"} onClick={() => setTab(t)}>{t}</button>)}</div>
    {msg && <div className="alert success">{msg}</div>}

    {!["Importação","Mapa"].includes(tab) && <div className="field"><label>Pesquisar</label><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar cadastro territorial..." /></div>}

    {tab === "Bairros" && <>
      <section className="panel"><h2>Novo bairro</h2><form onSubmit={createNeighborhood} className="form-grid"><div className="field"><label>Nome oficial</label><input name="name" required /></div><div className="field"><label>Tipo</label><select name="type"><option value="URBAN">Urbano</option><option value="RURAL">Rural</option><option value="DISTRICT">Distrito</option><option value="COMMUNITY">Comunidade</option><option value="OTHER">Outro</option></select></div><div className="field full"><button className="btn-primary">Criar bairro</button></div></form></section>
      <div className="table-wrap"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{visibleNeighborhoods.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.type}</td><td>{r.active ? "Ativo" : "Inativo"}</td><td><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button className="btn-ghost" onClick={() => rename("neighborhoods",r.id,r.name)}>Editar</button><button className="btn-ghost" onClick={() => toggle("neighborhoods", r.id, r.active)}>{r.active ? "Desativar" : "Reativar"}</button></div></td></tr>)}</tbody></table></div>
      <section className="panel"><h2>Mesclar bairros duplicados</h2><p className="muted">Use somente quando dois registros representam o mesmo bairro. Os vínculos existentes serão movidos para o registro oficial escolhido.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}><div className="field"><label>Registro duplicado</label><select value={mergeSource} onChange={e=>setMergeSource(e.target.value)}><option value="">Selecione</option>{neighborhoods.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div className="field"><label>Manter como oficial</label><select value={mergeTarget} onChange={e=>setMergeTarget(e.target.value)}><option value="">Selecione</option>{neighborhoods.filter(x=>x.active&&x.id!==mergeSource).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div></div><button type="button" className="btn-secondary" onClick={mergeNeighborhood}>Mesclar localidades</button></section>
    </>}

    {tab === "Ruas" && <>
      <section className="panel"><h2>Nova rua/logradouro</h2><form onSubmit={createStreet} className="form-grid"><div className="field"><label>Nome oficial</label><input name="name" required /></div><div className="field"><label>Tipo</label><input name="type" placeholder="Rua, Avenida, Travessa..." /></div><div className="field"><label>CEP</label><input name="cep" inputMode="numeric" /></div><div className="field"><label>Bairros relacionados</label><select name="neighborhoodIds" multiple size={5}>{neighborhoods.filter(n => n.active).map(n => <option value={n.id} key={n.id}>{n.name}</option>)}</select></div><div className="field full"><button className="btn-primary">Criar logradouro</button></div></form></section>
      <div className="table-wrap"><table><thead><tr><th>Logradouro</th><th>CEP</th><th>Bairros</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{visibleStreets.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.cep || "—"}</td><td>{r.neighborhoods.map(x => x.neighborhood.name).join(", ") || "—"}</td><td>{r.active ? "Ativo" : "Inativo"}</td><td><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button className="btn-ghost" onClick={() => rename("streets",r.id,r.name)}>Editar</button><button className="btn-ghost" onClick={() => toggle("streets", r.id, r.active)}>{r.active ? "Desativar" : "Reativar"}</button></div></td></tr>)}</tbody></table></div>
    </>}

    {tab === "Localidades rurais" && <>
      <section className="panel"><h2>Nova localidade rural</h2><form onSubmit={createRural} className="form-grid"><div className="field"><label>Nome oficial</label><input name="name" required /></div><div className="field"><label>Nome popular</label><input name="popularName" /></div><div className="field"><label>Distrito</label><select name="districtId"><option value="">Sem distrito</option>{districts.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><div className="field"><label>Região</label><input name="region" /></div><div className="field full"><button className="btn-primary">Criar localidade</button></div></form></section>
      <div className="table-wrap"><table><thead><tr><th>Localidade</th><th>Nome popular</th><th>Distrito</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{visibleRural.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.popularName || "—"}</td><td>{r.district?.name || "—"}</td><td>{r.active ? "Ativo" : "Inativo"}</td><td><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button className="btn-ghost" onClick={() => rename("rural-localities",r.id,r.name)}>Editar</button><button className="btn-ghost" onClick={() => toggle("rural-localities", r.id, r.active)}>{r.active ? "Desativar" : "Reativar"}</button></div></td></tr>)}</tbody></table></div>
    </>}

    {tab === "Distritos" && <>
      <section className="panel"><h2>Novo distrito</h2><form onSubmit={createDistrict} className="form-grid"><div className="field"><label>Nome oficial</label><input name="name" required /></div><div className="field full"><button className="btn-primary">Criar distrito</button></div></form></section>
      <div className="table-wrap"><table><thead><tr><th>Distrito</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{districts.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.active ? "Ativo" : "Inativo"}</td><td><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button className="btn-ghost" onClick={() => rename("districts",r.id,r.name)}>Editar</button><button className="btn-ghost" onClick={() => toggle("districts", r.id, r.active)}>{r.active ? "Desativar" : "Reativar"}</button></div></td></tr>)}</tbody></table></div>
    </>}

    {tab === "Aliases" && <>
      <section className="panel"><h2>Novo alias</h2><p className="muted">Cadastre nomes alternativos para que buscas como “sao jose” encontrem o registro oficial correto.</p><form onSubmit={createAlias} className="form-grid"><div className="field"><label>Tipo</label><select name="entityType" required><option value="NEIGHBORHOOD">Bairro</option><option value="STREET">Rua</option><option value="RURAL_LOCALITY">Localidade rural</option><option value="DISTRICT">Distrito</option></select></div><div className="field"><label>Registro oficial</label><select name="entityId" required><option value="">Selecione</option><optgroup label="Bairros">{neighborhoods.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</optgroup><optgroup label="Ruas">{streets.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</optgroup><optgroup label="Localidades rurais">{rural.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</optgroup><optgroup label="Distritos">{districts.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</optgroup></select></div><div className="field full"><label>Nome alternativo</label><input name="alias" placeholder="Ex.: Sao Jose, Triunfo, N. Viçosa" required/></div><div className="field full"><button className="btn-primary">Criar alias</button></div></form></section>
      <div className="table-wrap"><table><thead><tr><th>Alias</th><th>Aponta para</th><th>Tipo</th></tr></thead><tbody>{aliases.filter(x=>x.alias.toLowerCase().includes(query.toLowerCase())||x.targetName.toLowerCase().includes(query.toLowerCase())).map(x=><tr key={x.id}><td>{x.alias}</td><td>{x.targetName}</td><td>{x.entityType}</td></tr>)}</tbody></table></div>
    </>}

    {tab === "Mapa" && <section className="panel"><h2>Mapa territorial</h2><p className="muted">Mostra os registros que já possuem coordenadas. A ausência de ponto no mapa não remove o cadastro da base oficial.</p><TerritoryMap points={mapPoints}/>{!mapPoints.length&&<p className="muted">Nenhum registro territorial com coordenadas cadastrado.</p>}</section>}

    {tab === "Importação" && <section className="panel"><h2>Importar CSV/XLSX</h2><p className="muted">A importação passa por pré-visualização, normalização e detecção de registros existentes antes de gravar.</p><form onSubmit={previewFile} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><input name="file" type="file" accept=".csv,.xlsx,.xls" required /><button className="btn-secondary">Pré-visualizar</button></form>{preview && <div style={{ marginTop: 18 }}><p><strong>{preview.total}</strong> linhas · {preview.newCount} novas · {preview.existingCount} existentes · {preview.errorCount} erros</p><div className="table-wrap" style={{ maxHeight: 300 }}><table><thead><tr><th>Linha</th><th>Tipo</th><th>Nome</th><th>Status</th></tr></thead><tbody>{preview.rows.slice(0, 100).map((r: any) => <tr key={r.row}><td>{r.row}</td><td>{r.type}</td><td>{r.name}</td><td>{r.status}</td></tr>)}</tbody></table></div><button className="btn-primary" style={{ marginTop: 14 }} onClick={commit}>Confirmar importação</button></div>}</section>}
  </div>;
}
