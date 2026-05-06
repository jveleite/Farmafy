import { useState, useEffect } from 'react';
import { supabase } from './supabase';

function App() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [produtos, setProdutos] = useState([]);

  // 🔹 Buscar produtos ao carregar tela
  useEffect(() => {
    buscarProdutos();
  }, []);

  async function buscarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.log("ERRO AO BUSCAR:", error);
    } else {
      setProdutos(data);
    }
  }

  // 🔹 Cadastrar produto
  async function cadastrarProduto() {
    const { error } = await supabase
      .from('produtos')
      .insert([
        {
          nome: nome,
          preco: Number(preco)
        }
      ]);

    if (error) {
      console.log("ERRO:", error);
      alert("Erro ao cadastrar!");
    } else {
      alert("Produto cadastrado!");

      setNome('');
      setPreco('');

      // 🔥 atualiza lista automaticamente
      buscarProdutos();
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Sistema de Farmácia 💊</h1>

      <h2>Cadastro</h2>

      <input
        type="text"
        placeholder="Nome do produto"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Preço"
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
      />

      <br /><br />

      <button onClick={cadastrarProduto}>
        Cadastrar
      </button>

      <hr />

      <h2>Produtos cadastrados</h2>

      {produtos.map((produto) => (
        <div key={produto.id} style={{
          border: '1px solid #ccc',
          padding: 10,
          marginBottom: 10
        }}>
          <strong>{produto.nome}</strong> <br />
          R$ {produto.preco}
        </div>
      ))}
    </div>
  );
}

export default App;