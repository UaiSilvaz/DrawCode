import Contato from '@/components/Contato';
import Caracteristicas from '@/components/Caracteristicas';
import Clientes from '@/components/Clientes';
import Rodape from '@/components/Rodape';
import Precos from '@/components/Precos';
import Depoimentos from '@/components/Depoimentos';
import Topo from '@/components/Topo';
import Cabecalho from '@/components/Cabecalho';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Cabecalho />
      <Topo />
      <Caracteristicas />
      <Precos />
      <Depoimentos />
      <Clientes />
      <Contato />
      <Rodape />
    </div>
  );
}
