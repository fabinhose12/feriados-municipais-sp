import Link from "next/link";
import { usuarioAtual } from "../lib/sessao";
import { sair } from "./auth-actions";
import { BotaoGoogle } from "./botao-google";

export async function BarraUsuario() {
  const usuario = await usuarioAtual();

  if (!usuario) return <BotaoGoogle destino="/" rotulo="Entrar" />;

  return (
    <div className="site-usuario">
      {usuario.role === "ADMIN" && !usuario.bloqueado && <Link href="/admin">Moderar</Link>}
      <span className="site-nome" title={usuario.email}>
        {usuario.name.split(" ")[0]}
      </span>
      <form action={sair}>
        <button type="submit" className="btn-sair">
          Sair
        </button>
      </form>
    </div>
  );
}