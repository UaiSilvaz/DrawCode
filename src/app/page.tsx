import Contato from '@/screens/Inicio/components/Contato';
import Caracteristicas from '@/screens/Inicio/components/Caracteristicas';
import Clientes from '@/screens/Inicio/components/Clientes';
import Rodape from '@/screens/Inicio/components/Rodape';
import Founders from '@/screens/Inicio/components/Founders';
import Depoimentos from '@/screens/Inicio/components/Depoimentos';
import Topo from '@/screens/Inicio/components/Topo';
import Cabecalho from '@/screens/Inicio/components/Cabecalho';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Cabecalho />
      <Topo />
      <Caracteristicas />
      <Founders />
      <Depoimentos />
      <Clientes />
      <Contato />
      <Rodape />
    </div>
  );
}
