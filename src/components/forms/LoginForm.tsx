"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LoginForm() {
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const router=useRouter();
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const f=new FormData(e.currentTarget);
    const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:f.get("email"),password:f.get("password")})});
    const j=await r.json();
    setLoading(false);
    if(!r.ok) return setError(j.error||"Não foi possível entrar.");
    router.push(j.redirectTo || "/cidadao");
    router.refresh();
  }
  return <form onSubmit={submit} className="form-grid"><div className="field full"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required/></div><div className="field full"><label htmlFor="password">Senha</label><input id="password" name="password" type="password" autoComplete="current-password" required/></div>{error&&<div className="alert field full">{error}</div>}<div className="field full"><button className="btn-primary" disabled={loading}>{loading?"Entrando...":"Entrar"}</button></div></form>;
}
