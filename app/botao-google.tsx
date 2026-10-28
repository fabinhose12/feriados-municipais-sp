import { entrarComGoogle } from "./auth-actions";
import "./usuario.css";

export function BotaoGoogle({
  destino = "/",
  rotulo = "Entrar com Google",
}: {
  destino?: string;
  rotulo?: string;
}) {
  return (
    <form action={entrarComGoogle}>
      <input type="hidden" name="destino" value={destino} />
      <button type="submit" className="btn-google">
        {rotulo}
      </button>
    </form>
  );
}